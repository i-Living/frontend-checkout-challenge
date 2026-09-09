import { describe, expect, it } from 'vitest'
import {
    buildDelivery,
    toOrderErrorMessage,
    toServerFieldErrors,
    validateDraft,
} from '@/features/checkout/checkout-rules'
import { emptyDraft, makeApiError, validPickupDraft } from '@/test/fixtures'

describe('validateDraft', () => {
    it('принимает заполненный самовывоз', () => {
        expect(validateDraft(validPickupDraft)).toEqual({})
    })

    it('требует имя, email, телефон и пункт выдачи', () => {
        expect(validateDraft(emptyDraft)).toEqual({
            name: 'Укажите имя',
            email: 'Укажите корректный email',
            phone: 'Телефон в формате + и 10–15 цифр',
            pickupPointId: 'Выберите пункт выдачи',
        })
        expect(validateDraft({ ...validPickupDraft, email: 'bad', phone: '8999' })).toMatchObject({
            email: 'Укажите корректный email',
            phone: 'Телефон в формате + и 10–15 цифр',
        })
    })

    it('для курьера требует город, улицу и дом вместо пункта', () => {
        const errors = validateDraft({
            ...validPickupDraft,
            deliveryMethod: 'courier',
            pickupPointId: '',
            city: '',
            street: '',
            house: '',
        })
        expect(errors).toEqual({
            city: 'Укажите город',
            street: 'Укажите улицу',
            house: 'Укажите дом',
        })
        expect(errors.pickupPointId).toBeUndefined()
    })
})

describe('buildDelivery', () => {
    it('собирает самовывоз и курьера только из полных данных', () => {
        expect(buildDelivery(validPickupDraft)).toEqual({ method: 'pickup', pickupPointId: 'point-center' })
        expect(buildDelivery({ ...validPickupDraft, pickupPointId: '' })).toBeNull()
        expect(
            buildDelivery({
                ...validPickupDraft,
                deliveryMethod: 'courier',
                city: 'Москва',
                street: 'Тверская',
                house: '1',
                apartment: '10',
            }),
        ).toEqual({
            method: 'courier',
            address: { city: 'Москва', street: 'Тверская', house: '1', apartment: '10' },
        })
        expect(
            buildDelivery({
                ...validPickupDraft,
                deliveryMethod: 'courier',
                city: 'Москва',
                street: '',
                house: '1',
            }),
        ).toBeNull()
        expect(buildDelivery({ ...validPickupDraft, deliveryMethod: '' })).toBeNull()
    })
})

describe('order error mapping', () => {
    it('объясняет конфликт версии, протухший расчёт, пустую корзину и идемпотентность', () => {
        expect(toOrderErrorMessage(makeApiError({ code: 'CART_VERSION_CONFLICT' }))).toMatch(/Корзина изменилась/)
        expect(toOrderErrorMessage(makeApiError({ code: 'QUOTE_EXPIRED' }))).toMatch(/Расчёт устарел/)
        expect(toOrderErrorMessage(makeApiError({ code: 'CART_EMPTY' }))).toMatch(/Корзина пуста/)
        expect(toOrderErrorMessage(makeApiError({ code: 'IDEMPOTENCY_CONFLICT' }))).toMatch(/новый ключ/)
        expect(toOrderErrorMessage(makeApiError({ message: 'Сервер недоступен' }))).toBe('Сервер недоступен')
        expect(toOrderErrorMessage(new Error('offline'))).toBe('Попробуйте ещё раз.')
    })

    it('маппит VALIDATION_ERROR в известные поля и игнорирует прочие', () => {
        expect(
            toServerFieldErrors(
                makeApiError({
                    code: 'VALIDATION_ERROR',
                    fields: [
                        { path: '/customer/email', message: 'invalid' },
                        { path: '/delivery/address/apartment', message: 'too long' },
                    ],
                }),
            ),
        ).toEqual({ email: 'Укажите корректный email' })
        expect(toServerFieldErrors(makeApiError({ code: 'CART_EMPTY' }))).toBeNull()
        expect(
            toServerFieldErrors(
                makeApiError({
                    code: 'VALIDATION_ERROR',
                    fields: [{ path: '/delivery/address/apartment', message: 'too long' }],
                }),
            ),
        ).toBeNull()
    })
})
