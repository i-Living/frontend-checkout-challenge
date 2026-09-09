/**
 * Экран оформления (`/checkout`).
 * Отвечает за форму checkout, расчёт доставки (quote), создание заказа и навигацию к оплате.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { type CheckoutFieldErrors, CheckoutForm } from '@/features/checkout/checkout-form'
import {
    type CreateOrderBody,
    type CreateQuoteDelivery,
    createOrder,
    createQuote,
    getCart,
    getCheckoutOptions,
} from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { clearOrderKey, getOrCreateOrderKey } from '@/shared/api/idempotency'
import { keys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { type CheckoutDraft, useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Проверяет черновик формы оформления на клиенте.
 * @param draft Черновик из session-store
 * @returns Карта полевых ошибок, пустая — если всё корректно
 */
function validateDraft(draft: CheckoutDraft): CheckoutFieldErrors {
    const errors: CheckoutFieldErrors = {}
    if (!draft.name.trim()) {
        errors.name = 'Укажите имя'
    }
    if (!/.+@.+\..+/.test(draft.email.trim())) {
        errors.email = 'Укажите корректный email'
    }
    if (!/^\+[1-9]\d{9,14}$/.test(draft.phone.trim())) {
        errors.phone = 'Телефон в формате + и 10–15 цифр'
    }
    if (draft.deliveryMethod === 'courier') {
        if (!draft.city.trim()) {
            errors.city = 'Укажите город'
        }
        if (!draft.street.trim()) {
            errors.street = 'Укажите улицу'
        }
        if (!draft.house.trim()) {
            errors.house = 'Укажите дом'
        }
    } else if (!draft.pickupPointId) {
        errors.pickupPointId = 'Выберите пункт выдачи'
    }
    return errors
}

/**
 * Строит доставку для quote из черновика (курьер или самовывоз).
 * @param draft Черновик из session-store
 * @returns Доставка для quote либо null, если данных не хватает
 */
function buildDelivery(draft: CheckoutDraft): CreateQuoteDelivery | null {
    if (draft.deliveryMethod === 'courier') {
        const city = draft.city.trim()
        const street = draft.street.trim()
        const house = draft.house.trim()
        const apartment = draft.apartment.trim()
        if (!city || !street || !house) {
            return null
        }
        if (apartment) {
            return { method: 'courier', address: { city, street, house, apartment } } as CreateQuoteDelivery
        }
        return { method: 'courier', address: { city, street, house } } as CreateQuoteDelivery
    }
    if (!draft.pickupPointId) {
        return null
    }
    return { method: 'pickup', pickupPointId: draft.pickupPointId } as CreateQuoteDelivery
}

/**
 * Превращает ошибку создания заказа в текст (конфликт версий, протухший quote, пустая корзина).
 * @param error Ошибка создания заказа
 * @returns Текст сообщения пользователю
 */
function toOrderErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        if (error.code === 'CART_VERSION_CONFLICT') {
            return 'Корзина изменилась. Обновите корзину и продолжите оформление.'
        }
        if (error.code === 'QUOTE_EXPIRED') {
            return 'Расчёт устарел. Создайте новый расчёт с той же доставкой.'
        }
        if (error.code === 'CART_EMPTY') {
            return 'Корзина пуста. Вернитесь в корзину и добавьте товары.'
        }
        if (error.code === 'IDEMPOTENCY_CONFLICT') {
            return 'Запрос уже обрабатывался с другими данными. Повторите попытку.'
        }
        return error.message
    }
    return 'Попробуйте ещё раз.'
}

/**
 * Маппит серверную VALIDATION_ERROR в полевые ошибки формы.
 * @param error Ошибка создания заказа
 * @returns Карта полевых ошибок либо null, если это не серверная валидация
 */
function toServerFieldErrors(error: unknown): CheckoutFieldErrors | null {
    if (!isApiError(error) || error.code !== 'VALIDATION_ERROR' || !error.fields) {
        return null
    }
    const mapped: CheckoutFieldErrors = {}
    for (const field of error.fields) {
        const leaf = field.path.split('/').pop()
        if (leaf === 'name') {
            mapped.name = 'Укажите имя'
        } else if (leaf === 'email') {
            mapped.email = 'Укажите корректный email'
        } else if (leaf === 'phone') {
            mapped.phone = 'Телефон в формате + и 10–15 цифр'
        } else if (leaf === 'pickupPointId') {
            mapped.pickupPointId = 'Выберите пункт выдачи'
        } else if (leaf === 'city') {
            mapped.city = 'Укажите город'
        } else if (leaf === 'street') {
            mapped.street = 'Укажите улицу'
        } else if (leaf === 'house') {
            mapped.house = 'Укажите дом'
        }
    }
    return Object.keys(mapped).length > 0 ? mapped : null
}

/**
 * Экран оформления (`/checkout`): форма покупателя и доставки плюс сайдбар с итогом.
 * Пропсов нет. Ветки: скелетон, ошибка загрузки, редирект при пустой корзине, форма + quote.
 * @returns Разметка страницы оформления
 */
export function CheckoutPage() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const draft = useSessionStore((state) => state.draft)
    const patchDraft = useSessionStore((state) => state.patchDraft)
    const setOrderId = useSessionStore((state) => state.setOrder)
    const setPaymentId = useSessionStore((state) => state.setPayment)
    const [errors, setErrors] = useState<CheckoutFieldErrors>({})

    const cartQuery = useQuery({
        queryKey: keys.cart,
        queryFn: ({ signal }) => getCart(signal),
    })
    const optionsQuery = useQuery({
        queryKey: keys.checkoutOptions,
        queryFn: ({ signal }) => getCheckoutOptions(signal),
    })

    useEffect(() => {
        if (!optionsQuery.data) {
            return
        }
        const patch: Partial<CheckoutDraft> = {}
        if (!draft.deliveryMethod) {
            const firstDelivery = optionsQuery.data.deliveryMethods[0]?.id
            if (firstDelivery) {
                patch.deliveryMethod = firstDelivery
            }
        }
        if (!draft.paymentMethod) {
            const firstPayment = optionsQuery.data.paymentMethods[0]?.id
            if (firstPayment) {
                patch.paymentMethod = firstPayment
            }
        }
        if (Object.keys(patch).length > 0) {
            patchDraft(patch)
        }
    }, [optionsQuery.data, draft.deliveryMethod, draft.paymentMethod, patchDraft])

    const [debouncedAddress, setDebouncedAddress] = useState({
        city: draft.city,
        street: draft.street,
        house: draft.house,
        apartment: draft.apartment,
    })

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedAddress({
                city: draft.city,
                street: draft.street,
                house: draft.house,
                apartment: draft.apartment,
            })
        }, 300)
        return () => clearTimeout(timer)
    }, [draft.city, draft.street, draft.house, draft.apartment])

    const effectiveDraft = useMemo<CheckoutDraft>(() => {
        if (draft.deliveryMethod === 'courier') {
            return { ...draft, ...debouncedAddress }
        }
        return draft
    }, [draft, debouncedAddress])

    const effectiveDelivery = useMemo(() => buildDelivery(effectiveDraft), [effectiveDraft])
    const deliveryKey = effectiveDelivery ? JSON.stringify(effectiveDelivery) : null
    const cartVersion = cartQuery.data?.version
    const hasItems = (cartQuery.data?.items.length ?? 0) > 0
    const quoteEnabled =
        cartQuery.data !== undefined && hasItems && cartVersion !== undefined && effectiveDelivery !== null

    // B5: ключ включает cartVersion и hash delivery — запоздавший ответ по старому
    // ключу не затирает свежий, отмена через signal из Query.
    const quoteQuery = useQuery({
        queryKey: ['quote', cartVersion, deliveryKey],
        queryFn: ({ signal }) => createQuote(cartVersion as number, effectiveDelivery as CreateQuoteDelivery, signal),
        enabled: quoteEnabled,
    })

    useEffect(() => {
        const error = quoteQuery.error
        if (isApiError(error) && error.code === 'CART_VERSION_CONFLICT') {
            void queryClient.invalidateQueries({ queryKey: keys.cart })
        }
    }, [quoteQuery.error, queryClient])

    const createOrderMutation = useMutation({
        mutationFn: ({ body, key }: { body: CreateOrderBody; key: string }) => createOrder(body, key),
        onSuccess: (order) => {
            clearOrderKey()
            setOrderId(order.id)
            // Новый заказ — чужой paymentId из стора больше не валиден, сбрасываем,
            // иначе pay-экран опросит старую попытку и уйдёт в редирект-петлю.
            setPaymentId(null)
            void queryClient.invalidateQueries({ queryKey: keys.cart })
            if (order.paymentMethod === 'cash_on_delivery') {
                navigate(`/orders/${order.id}`)
            } else {
                navigate(`/orders/${order.id}/pay`)
            }
        },
        onError: (error: unknown) => {
            const fieldErrors = toServerFieldErrors(error)
            if (fieldErrors) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }))
            }
            if (!isApiError(error)) {
                return
            }
            if (error.code === 'CART_VERSION_CONFLICT' || error.code === 'CART_EMPTY') {
                void queryClient.invalidateQueries({ queryKey: keys.cart })
            } else if (error.code === 'QUOTE_EXPIRED') {
                void quoteQuery.refetch()
            }
        },
    })

    /**
     * Обновляет черновик и сбрасывает ошибки по затронутым полям.
     * @param patch Частичное обновление черновика
     * @returns void
     */
    function handleDraftChange(patch: Partial<CheckoutDraft>) {
        patchDraft(patch)
        setErrors((prev) => {
            if (Object.keys(prev).length === 0) {
                return prev
            }
            const next = { ...prev }
            for (const key of Object.keys(patch) as (keyof CheckoutDraft)[]) {
                if (key === 'deliveryMethod') {
                    delete next.pickupPointId
                    delete next.city
                    delete next.street
                    delete next.house
                } else if (
                    key === 'name' ||
                    key === 'email' ||
                    key === 'phone' ||
                    key === 'pickupPointId' ||
                    key === 'city' ||
                    key === 'street' ||
                    key === 'house'
                ) {
                    delete next[key]
                }
            }
            return next
        })
    }

    /**
     * Валидирует форму и создаёт заказ по текущему quote с ключом идемпотентности.
     * @param validData Актуальный черновик из формы
     * @returns void
     */
    function handleSubmit(validData: CheckoutDraft) {
        const validation = validateDraft(validData)
        setErrors(validation)
        if (Object.keys(validation).length > 0) {
            return
        }
        const quote = quoteQuery.data
        if (!quote) {
            void quoteQuery.refetch()
            return
        }
        const body: CreateOrderBody = {
            quoteId: quote.id,
            paymentMethod: validData.paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'card',
            customer: {
                name: validData.name.trim(),
                email: validData.email.trim(),
                phone: validData.phone.trim(),
            },
        }
        // B2: повтор сети / двойной клик — те же key+body. Кнопка disabled isPending,
        // clear только onSuccess, смена body даёт новый ключ внутри getOrCreate.
        const key = getOrCreateOrderKey(body)
        createOrderMutation.mutate({ body, key })
    }

    if (cartQuery.isPending || optionsQuery.isPending) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оформление заказа</h1>
                <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]'>
                    <div className='flex min-w-0 flex-col gap-4'>
                        <Skeleton className='h-11 w-full' />
                        <Skeleton className='h-11 w-full' />
                        <Skeleton className='h-11 w-full' />
                        <Skeleton className='h-24 w-full' />
                    </div>
                    <Skeleton className='h-48 w-full' />
                </div>
            </div>
        )
    }

    if (cartQuery.isError || optionsQuery.isError) {
        const error = cartQuery.isError ? cartQuery.error : optionsQuery.error
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оформление заказа</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить оформление</AlertTitle>
                    <AlertDescription>{isApiError(error) ? error.message : 'Попробуйте ещё раз.'}</AlertDescription>
                </Alert>
                <Button
                    className='mt-4 w-full sm:w-auto'
                    onClick={() => {
                        if (cartQuery.isError) {
                            void cartQuery.refetch()
                        }
                        if (optionsQuery.isError) {
                            void optionsQuery.refetch()
                        }
                    }}
                    type='button'
                >
                    Повторить
                </Button>
            </div>
        )
    }

    const cart = cartQuery.data
    const options = optionsQuery.data

    if (cart.items.length === 0) {
        return <Navigate replace to='/cart' />
    }

    const submitLabel = draft.paymentMethod === 'cash_on_delivery' ? 'Оформить заказ' : 'Оформить и перейти к оплате'
    const quote = quoteQuery.data
    const subtotal = quote?.subtotal ?? cart.subtotal
    const quoteError = quoteQuery.error

    return (
        <div>
            <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оформление заказа</h1>
            <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]'>
                <div className='min-w-0'>
                    {createOrderMutation.isError ? (
                        <Alert className='mb-4' variant='destructive'>
                            <CircleAlert />
                            <AlertTitle>Не удалось создать заказ</AlertTitle>
                            <AlertDescription>{toOrderErrorMessage(createOrderMutation.error)}</AlertDescription>
                        </Alert>
                    ) : null}
                    <CheckoutForm
                        draft={draft}
                        errors={errors}
                        isPending={createOrderMutation.isPending}
                        onDraftChange={handleDraftChange}
                        onSubmit={handleSubmit}
                        options={options}
                        submitLabel={submitLabel}
                    />
                    {createOrderMutation.isError ? (
                        <Button
                            className='mt-4 w-full sm:w-auto'
                            disabled={createOrderMutation.isPending}
                            onClick={() => handleSubmit(draft)}
                            type='button'
                            variant='outline'
                        >
                            Повторить
                        </Button>
                    ) : null}
                </div>
                <aside className='min-w-0 lg:sticky lg:top-4 lg:self-start'>
                    <Card className='min-w-0'>
                        <CardHeader>
                            <CardTitle>Итого</CardTitle>
                        </CardHeader>
                        <CardContent className='flex min-w-0 flex-col gap-2'>
                            <p className='flex min-w-0 flex-wrap justify-between gap-2 text-sm'>
                                <span className='text-muted-foreground'>Товары</span>
                                <span className='font-medium'>{formatMoney(subtotal)}</span>
                            </p>
                            {quote ? (
                                <>
                                    <p className='flex min-w-0 flex-wrap justify-between gap-2 text-sm'>
                                        <span className='text-muted-foreground'>Доставка</span>
                                        <span className='font-medium'>{formatMoney(quote.shipping)}</span>
                                    </p>
                                    <p className='flex min-w-0 flex-wrap justify-between gap-2 font-semibold'>
                                        <span>К оплате</span>
                                        <span>{formatMoney(quote.total)}</span>
                                    </p>
                                </>
                            ) : quoteQuery.isError ? (
                                <>
                                    <Alert variant='destructive'>
                                        <CircleAlert />
                                        <AlertTitle>
                                            {isApiError(quoteError) && quoteError.code === 'CART_VERSION_CONFLICT'
                                                ? 'Корзина изменилась'
                                                : isApiError(quoteError) && quoteError.code === 'QUOTE_EXPIRED'
                                                  ? 'Расчёт устарел'
                                                  : 'Не удалось посчитать доставку'}
                                        </AlertTitle>
                                        <AlertDescription>
                                            {isApiError(quoteError) && quoteError.code === 'CART_VERSION_CONFLICT'
                                                ? 'Обновите корзину и продолжите оформление.'
                                                : isApiError(quoteError) && quoteError.code === 'QUOTE_EXPIRED'
                                                  ? 'Создайте новый расчёт с той же доставкой.'
                                                  : isApiError(quoteError)
                                                    ? quoteError.message
                                                    : 'Попробуйте ещё раз.'}
                                        </AlertDescription>
                                    </Alert>
                                    <Button
                                        className='w-full sm:w-auto'
                                        disabled={quoteQuery.isFetching}
                                        onClick={() => {
                                            if (isApiError(quoteError) && quoteError.code === 'CART_VERSION_CONFLICT') {
                                                void queryClient
                                                    .invalidateQueries({ queryKey: keys.cart })
                                                    .then(() => quoteQuery.refetch())
                                            } else {
                                                void quoteQuery.refetch()
                                            }
                                        }}
                                        type='button'
                                        variant='outline'
                                    >
                                        Повторить
                                    </Button>
                                    <p className='text-muted-foreground text-sm'>Считаем доставку…</p>
                                </>
                            ) : (
                                <p
                                    aria-live='polite'
                                    className='flex min-w-0 items-center gap-2 text-muted-foreground text-sm'
                                >
                                    <LoaderCircle aria-hidden className='size-4 shrink-0 animate-spin' />
                                    Считаем доставку…
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
