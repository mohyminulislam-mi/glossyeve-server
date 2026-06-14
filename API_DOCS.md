# A One Lube API Docs

Base URL:

```txt
http://localhost:5000
```

Production/Vercel URL thakle same path use hobe, example: `https://your-domain.com/api/products`.

## Auth Rules

Private API call korte login/register response-er JWT token lagbe.

Token dui vabe pathano jay:

```txt
Cookie: token=<jwt>
```

or

```txt
Authorization: Bearer <jwt>
```

Roles:

- `customer`: normal user
- `employee`: product/order/admin dashboard access
- `admin`: full access including user role update

## Health

| Method | API | Access | Kaj |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Server and DB status check |
| `GET` | `/` | Public | Root test message |

## Auth APIs

### Register

`POST /api/auth/register`

New customer account create kore and token return kore.

Body:

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "password": "123456",
  "phone": "01700000000"
}
```

Response: `success`, `token`, `user`

### Login

`POST /api/auth/login`

Email/password diye login kore token return kore.

Body:

```json
{
  "email": "customer@example.com",
  "password": "123456"
}
```

Response: `success`, `token`, `user`

### Google Login

`POST /api/auth/google-login`

Google/Firebase login simulation. Email diye user khuje, na thakle create kore.

Body:

```json
{
  "email": "customer@example.com",
  "name": "Customer Name",
  "avatar": "https://image-url.com/avatar.png",
  "googleId": "google-user-id"
}
```

### Logout

`POST /api/auth/logout`

Cookie token clear kore.

### Forgot Password

`POST /api/auth/forgot-password`

Password reset request simulation.

Body:

```json
{
  "email": "customer@example.com"
}
```

### Current User

`GET /api/auth/me`

Private. Logged-in user profile return kore.

## Product APIs

### Get Products

`GET /api/products`

Public. Product list, search, filter, sort, pagination.

Query params:

| Param | Example | Kaj |
| --- | --- | --- |
| `search` | `engine` | name/description/sku search |
| `category` | `engine-oil` | category slug or id filter |
| `brand` | `a-one` | brand slug or id filter |
| `minPrice` | `100` | minimum price |
| `maxPrice` | `1000` | maximum price |
| `sort` | `priceAsc` | sort option |
| `page` | `1` | page number |
| `limit` | `12` | per page count |

Sort values:

```txt
priceAsc, priceDesc, nameAsc, nameDesc, ratingDesc
```

Example:

```txt
GET /api/products?search=oil&category=engine-oil&sort=priceAsc&page=1&limit=12
```

### Get Product Details

`GET /api/products/:id_or_slug`

Public. Product ID or slug diye single product details.

Example:

```txt
GET /api/products/engine-oil-20w50
GET /api/products/665fabc12345678901234567
```

### Create Product

`POST /api/products`

Private. Only `admin` or `employee`.

Body:

```json
{
  "name": "Engine Oil 20W50",
  "sku": "EO-20W50-1L",
  "description": "Premium engine oil",
  "specifications": [
    { "key": "Viscosity", "value": "20W50" }
  ],
  "benefits": ["Smooth engine", "Long life"],
  "category": "categoryObjectId",
  "brand": "brandObjectId",
  "price": 500,
  "discountPrice": 450,
  "stock": 100,
  "images": ["https://image-url.com/product.jpg"]
}
```

### Update Product

`PUT /api/products/:id`

Private. Only `admin` or `employee`. Product-er any field update.

### Delete Product

`DELETE /api/products/:id`

Private. Only `admin` or `employee`. Actually soft delete kore: `active: false`.

### Get Categories

`GET /api/products/categories`

Public. Active categories list.

### Get Brands

`GET /api/products/brands`

Public. Active brands list.

## Order APIs

Order APIs private. Token required.

### Create Order

`POST /api/orders`

Customer order create kore. Product stock check kore, subtotal/total calculate kore, stock decrease kore.

Body:

```json
{
  "items": [
    {
      "product": "productObjectId",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "House 1, Road 2",
    "city": "Dhaka",
    "postalCode": "1207",
    "country": "Bangladesh"
  },
  "billingAddress": {
    "street": "House 1, Road 2",
    "city": "Dhaka",
    "postalCode": "1207",
    "country": "Bangladesh"
  },
  "paymentMethod": "cod",
  "couponCode": "SAVE10"
}
```

Payment methods:

```txt
card, cod, bank, manual
```

Manual payment body example:

```json
{
  "items": [
    {
      "product": "productObjectId",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "House 1",
    "city": "Dhaka",
    "postalCode": "1207",
    "country": "Bangladesh"
  },
  "paymentMethod": "manual",
  "manualPaymentDetails": {
    "transactionId": "TXN123",
    "senderMobile": "01700000000",
    "paymentMethod": "bkash"
  }
}
```

Notes:

- Shipping cost is `5` if subtotal is `<= 150`
- Shipping cost is `0` if subtotal is `> 150`
- `card` payment creates `paymentStatus: paid`
- `manual` payment creates `orderStatus: pending_verification`

### My Orders

`GET /api/orders/my-orders`

Logged-in customer-er own order history.

### Get Order Details

`GET /api/orders/:id`

Customer nijer order dekhte parbe. Admin/employee any order dekhte parbe.

### Get All Orders

`GET /api/orders`

Private. Only `admin` or `employee`. Sob order list.

### Update Order Status

`PUT /api/orders/:id/status`

Private. Only `admin` or `employee`.

Body:

```json
{
  "orderStatus": "processing",
  "paymentStatus": "paid"
}
```

Order status values:

```txt
pending, pending_verification, processing, shipped, delivered, cancelled
```

Payment status values:

```txt
pending, paid, failed
```

Note: order cancel korle product stock back add hoy.

## Review APIs

### Get Product Reviews

`GET /api/reviews/product/:productId`

Public. Product-er reviews list.

### Add Review

`POST /api/reviews/:productId`

Private. Logged-in user product review add kore. Same user same product-e ekbar review dite parbe.

Body:

```json
{
  "rating": 5,
  "comment": "Very good product"
}
```

Rating range: `1` to `5`

### Delete Review

`DELETE /api/reviews/:id`

Private. Review owner or `admin` delete korte parbe.

## Admin APIs

Admin APIs private.

### Dashboard Stats

`GET /api/admin/stats`

Only `admin` or `employee`.

Returns:

- total revenue from paid orders
- total orders
- total products
- total customers
- low stock count
- total investments

### Dashboard Charts

`GET /api/admin/charts`

Only `admin` or `employee`.

Returns:

- last 6 months revenue chart
- sales by category chart
- order status chart

### Get Users

`GET /api/admin/users`

Only `admin`. Sob users list.

### Update User Role

`PUT /api/admin/users/:id/role`

Only `admin`. User role and investment amount update.

Body:

```json
{
  "role": "employee",
  "investmentAmount": 5000
}
```

Allowed roles:

```txt
customer, employee, admin
```

## Common Error Response

Most errors ei format-e ashe:

```json
{
  "success": false,
  "message": "Error message"
}
```

Common status codes:

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation issue |
| `401` | Token missing or invalid |
| `403` | Role permission nai |
| `404` | Resource not found |
| `500` | Server error |
