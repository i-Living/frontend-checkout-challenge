# Wiki Index

> Project Component Catalog.
> Last updated: 2026-09-12
> Total pages: 53

## Flow

- [[checkout-flow]] — Catalog → cart → checkout → order → pay. Assignment invariants.

## Entities

- [[Alert]] — Alert is an exported React component that renders a `<div>` element. It is intended to serve as a basic alert/notificati
- [[App]] — Root application component that renders the application shell, including a header with navigation and utility controls, 
- [[assert]] — Internal utility that unwraps a `Result`-like object. It returns the success value if the operation succeeded; otherwise
- [[Button]] — Button is an exported React component. Its AST signature records the JSX root as `<Comp>`.
- [[Card]] — The `Card` component is a presentational container that renders a `<div>` element. It is exported for use throughout the
- [[CardPicker]] — `CardPicker` is a controlled selection component that renders a set of card options and reports the selected card to its
- [[CartLine]] — Renders a single cart line item with a quantity stepper and input. The quantity is committed as an absolute value on blu
- [[CartPage]] — `CartPage` renders the `/cart` route. It displays the user's cart with line items, quantity controls, stock limits, and 
- [[CatalogPage]] — `CatalogPage` is a page-level component that renders the product catalog view. It composes loading skeletons, a shopping
- [[checkout-rules]] — Client checkout validation, delivery payload for quotes, mapping of server `VALIDATION_ERROR` to fields.
- [[CheckoutForm]] — Checkout form that collects contact, delivery, and payment data. It is a controlled component without local state: the d
- [[CheckoutPage]] — Page component for the `/checkout` route. Handles quote calculation and order creation. Redirects to `/cart` if the cart
- [[client]] — HTTP client: path builders, Authorization, Idempotency-Key, JSON/204, and normalized `ApiError`.
- [[cn]] — `clsx` + `twMerge` for `className`; last conflicting Tailwind utility wins.
- [[DeliveryFields]] — `DeliveryFields` is a controlled form component that renders delivery-related input fields. It adapts its UI based on th
- [[endpoints]] — Typed endpoints built on top of `request`. Types are derived from OpenAPI, not manual DTOs. Catalog and sandbox endpoint
- [[errors]] — Normalizes API errors and provides UI texts. Pages do not switch on `code` directly; they use `toUserMessage` / `toError
- [[FormField]] — FormField is a React component that renders a form field wrapper containing a `Label` and a paragraph (`<p>`) element. I
- [[idempotency]] — Internal utility module (not exported) for managing idempotency keys associated with order and payment operations. It pr
- [[Input]] — `Input` is a React component that renders a native `<input>` element. It is exported for use in other parts of the appli
- [[invalidate]] — Query cache reset helpers keyed through `query-keys.ts`. Pages must not pass raw arrays.
- [[Label]] — The `Label` utility is an exported JavaScript/TypeScript module. It is classified as a utility (`util`) in the AST. The 
- [[main]] — Root-level application component that composes global providers and routing infrastructure. It wraps the application tre
- [[money]] — `formatMoney(kopecks)` — API amounts are integer kopecks, `RUB`. Do not invent totals on the client.
- [[MutationAlert]] — `MutationAlert` is an exported React component that renders an alert notification for mutation feedback. It composes the
- [[NotFoundPage]] — `NotFoundPage` is a presentational fallback component rendered when no route matches. It displays a 404-style message an
- [[OptionRadioGroup]] — `OptionRadioGroup` is a React component that renders a radio group selection interface. It composes `RadioGroup` and `Ra
- [[OrderPage]] — `OrderPage` is the page component for the `/orders/:orderId` route. It displays order details and handles payment-state-
- [[OrderSuccessCard]] — Displays an order confirmation summary inside a card, with a success icon, heading, supporting text, and order details.
- [[OrderSummary]] — Displays a summary of an order, including its items and delivery information.
- [[PageError]] — Displays a full-page error state using an alert box with an icon, title, description, and a navigation button/link.
- [[PaymentPage]] — Renders the card payment page for the route `/orders/:orderId/pay`. Supports sandbox card selection, payment attempt cre
- [[pluralize]] — Internal utility module that provides a `pluralize` handler. It is not exported and is intended for internal use within 
- [[ProductCard]] — `ProductCard` displays a catalog product with its visual, title, description, price, stock status, and cart controls. It
- [[ProductVisual]] — `ProductVisual` is a React component that renders a product visual area. It outputs a `<div>` wrapper containing an `<Ic
- [[Providers]] — `Providers` is a React component that renders a `QueryClientProvider`, establishing React Query context for its child co
- [[queries]] — React Query read hooks (`useCart`, `useProducts`, `useOrder`, …). Pages do not pass queryKey/queryFn.
- [[query-gate]] — This component acts as a rendering gate between two page-level states: `<PagePending>` and `<PageError>`. It uses the `q
- [[query-keys]] — Query cache keys. Factory without id invalidates a group; with id, one entity. `quoteByVersion` is separate so a late POST cannot overwrite a newer quote.
- [[query-state]] — Shared pending/error screens. 404 goes to catalog; other errors retry. Pages do not copy skeleton + Alert.
- [[RadioGroup]] — `RadioGroup` is an exported React component. Based on the AST signature, its JSX renders a `CircleIcon`, which serves as
- [[RouteError]] — `RouteError` is an exported React component that renders a user-friendly error state for route-level failures. It presen
- [[router]] — > Based on AST signature. Source code omitted; only structural information is available.
- [[session]] — This module is a utility for session management. It is not exported (`Exports: false`) and is intended for internal use.
- [[session-store]] — Client-side tab state for the checkout flow: bearer token, current order/payment IDs, checkout form draft, and idempoten
- [[Skeleton]] — A React component that renders a placeholder `<div>`, commonly used to display loading states while content is being fet
- [[theme-store]] — Light/dark/system theme store: detect system preference, apply, init on startup.
- [[ThemeToggle]] — A button component that toggles between light and dark theme modes. Renders a `<Button>` containing `<Sun>` and `<Moon>`
- [[usePageTitle]] — `usePageTitle` is a custom hook that synchronizes the current page title with the browser document title. It updates `do
- [[usePaymentAttempt]] — `usePaymentAttempt` manages the lifecycle of a payment attempt for a given order. It combines payment creation and sandb
- [[usePaymentPoll]] — `usePaymentPoll` is a React hook that manages polling of a payment status. It repeatedly checks the current payment stat
- [[useQuote]] — Custom hook for managing quote data. It integrates with React Query to fetch a quote and includes an effect that reacts 
- [[useSetCartItem]] — The `useSetCartItem` hook is a custom React hook intended to handle setting or updating a cart item. It is not exported 
