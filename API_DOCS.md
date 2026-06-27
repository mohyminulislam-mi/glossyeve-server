# A One Lube API Docs

Base URL:

```txt
http://localhost:5000
```

Production/Vercel URL দিলে একই path ব্যবহার করুন, উদাহরণ: `https://your-domain.com/api/products`।

---

## সারাংশ (Auth / Roles / Token পাঠানোর পদ্ধতি)

Private API কল করতে login/register response-এর JWT token প্রয়োজন। Token পাঠানোর দুটি বৈধ উপায়:

- Cookie: `Cookie: token=<jwt>`
- Authorization header: `Authorization: Bearer <jwt>`

Roles:

- `customer` — সাধারণ ক্রেতা
- `manager` — প্রোডাক্ট/অর্ডার/ড্যাশবোর্ড ব্যবস্থাপনা
- `admin` — সম্পূর্ণ অ্যাক্সেস (ইউজার রোল পরিবর্তন সহ)

নোট: প্রোডাকশন-এ `process.env.JWT_SECRET` অবশ্যই সেট থাকতে হবে; লোকাল ডিফল্ট সিক্রেট ব্যবহার না করা উচিত।

---

## Health

1. ✅ Server Health

URL: `/api/health`
Method: GET
Access: Public
Description: সার্ভার এবং ডাটাবেস সংযোগ স্ট্যাটাস চেক করে।

2. ✅ Root

URL: `/`
Method: GET
Access: Public
Description: সহজ টেস্ট রেসপন্স (API চালু আছে কি না)।

---

## Auth APIs

1. 📝 Register (POST)

URL: `/api/auth/register`
Method: POST
Access: Public
Description: নতুন কাস্টমার অ্যাকাউন্ট তৈরি করে এবং JWT token রিটার্ন করে।

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

Notes: email unique; password validation কন্ট্রোলার-এ আছে।

2. 🔐 Login (POST)

URL: `/api/auth/login`
Method: POST
Access: Public
Description: Email ও password দিয়ে লগইন করে JWT token রিটার্ন করে।

Body:

```json
{
  "email": "customer@example.com",
  "password": "123456"
}
```

Response: `success`, `token`, `user`

3. 🌐 Google Login (POST)

URL: `/api/auth/google-login`
Method: POST
Access: Public
Description: Google/Firebase লগইন সিমুলেশন — email দিয়ে ইউজার খোঁজে, না থাকলে তৈরি করে।

Body:

```json
{
  "email": "customer@example.com",
  "name": "Customer Name",
  "avatar": "https://image-url.com/avatar.png",
  "googleId": "google-user-id"
}
```

4. 🚪 Logout (POST)

URL: `/api/auth/logout`
Method: POST
Access: Public (cookie clear)
Description: HTTP-only cookie থেকে token সরিয়ে দেয় (logout)।

5. 🔁 Forgot Password (POST)

URL: `/api/auth/forgot-password`
Method: POST
Access: Public
Body:

```json
{ "email": "customer@example.com" }
```

Description: পাসওয়ার্ড রিসেট রিকোয়েস্ট সিমুলেশন। (আপনি কন্ট্রোলার-এ যে লজিক দিয়েছেন সেটাই চলবে)

6. 👤 Current User (GET)

URL: `/api/auth/me`
Method: GET
Access: Private (Require token)
Description: লগইন করা ইউজারের প্রোফাইল রিটার্ন করে।

---

## Product APIs

General notes:
- GET `/api/products` এ query validation ও sanitization যোগ করা হয়েছে (search regex escape, numeric parse, page/limit cap, allowed sort values) — invalid params হলে সার্ভার 400 রিটার্ন করতে পারে。
- Create/Update product body-এর জন্য সার্ভারে basic validation আছে (name, sku, numeric fields ইত্যাদি)。
- Delete product soft-delete: `active: false` সেট করে; ডাটাবেস থেকে permanent remove করে না।

1. 🧾 Get Products (GET)

URL: `/api/products`
Method: GET
Access: Public
Description: Product তালিকা; search, filter, sort ও pagination সমর্থন করে।

Query params:

| Param | Example | Description |
| --- | --- | --- |
| `search` | `engine` | name/description/sku অনুসারে অনুসন্ধান (safe-escaped regex) |
| `category` | `engine-oil` | category slug বা id ব্যবহার করে filter |
| `brand` | `a-one` | brand slug বা id filter |
| `minPrice` | `100` | minimum price (non-negative number) |
| `maxPrice` | `1000` | maximum price (non-negative number) |
| `sort` | `priceAsc` | supported: `priceAsc, priceDesc, nameAsc, nameDesc, ratingDesc` |
| `page` | `1` | page number (default 1) |
| `limit` | `12` | per-page count (default 12, max 100)

Example:

```
GET /api/products?search=oil&category=engine-oil&sort=priceAsc&page=1&limit=12
```

Response: JSON with `success`, `count`, `total`, `page`, `pages`, `products` (normalized objects)

Notes:
- Search string-এর জন্য special RegExp character ইস্কেপ করা হয়, ReDoS ঝুঁকি কমানো হয়েছে。
- বড় dataset-এ performance নিশ্চিত করতে index এবং full-text options পরামর্শযোগ্য।

2. 🔍 Get Product Details (GET)

URL: `/api/products/:id_or_slug`
Method: GET
Access: Public
Description: Product ID (24-hex ObjectId) অথবা slug দিয়ে একক প্রোডাক্টের বিস্তারিত রিটার্ন করে।

Example:

```
GET /api/products/engine-oil-20w50
GET /api/products/665fabc12345678901234567
```

Response: `success`, `product` (normalized)

3. ➕ Create Product (POST)

URL: `/api/products`
Method: POST
Access: Private (roles: `admin`, `manager`)
Description: নতুন প্রোডাক্ট তৈরি করে।

Body (example):

```json
{
  "name": "Engine Oil 20W50",
  "sku": "EO-20W50-1L",
  "description": "Premium engine oil",
  "specifications": [{ "key": "Viscosity", "value": "20W50" }],
  "benefits": ["Smooth engine", "Long life"],
  "category": "categoryObjectId",
  "brand": "brandObjectId",
  "price": 500,
  "discountPrice": 450,
  "stock": 100,
  "images": ["https://image-url.com/product.jpg"]
}
```

Validation: name & sku required; price/discountPrice/stock must be non-negative numbers; images must be array if provided.

Response: `201` with `success` and created `product` (populated category & brand)

4. ✏️ Update Product (PUT)

URL: `/api/products/:id`
Method: PUT
Access: Private (roles: `admin`, `manager`)
Description: পণ্য-টিকে আপডেট করে। Partial update সমর্থিত; পাঠানো ফিল্ডগুলো মেরামত হবে।

Validation: numeric fields validated; images must be array if provided.

Response: `200` with updated `product`

5. 🗑️ Delete Product (DELETE)

URL: `/api/products/:id`
Method: DELETE
Access: Private (roles: `admin`, `manager`)
Description: soft-delete করে (`active: false`), permanent remove করে না।

Response: `200` with success message

6. 🗂️ Get Categories (GET)

URL: `/api/products/categories`
Method: GET
Access: Public
Description: active বা legacy (active field অনুপস্থিত) ক্যাটেগরি তালিকা দেয়।

7. 🏷️ Get Brands (GET)

URL: `/api/products/brands`
Method: GET
Access: Public
Description: active brands এর তালিকা রিটার্ন করে।

---

## Order APIs

নোট: Order রুটগুলো প্রোটেক্টেড — `router.use(protect)` করা আছে।

1. 🛒 Create Order (POST)

URL: `/api/orders`
Method: POST
Access: Private (logged-in customer)
Description: অর্ডার তৈরি করে; প্রোডাক্ট স্টক যাচাই করে, subtotal/total হিসাব করে এবং স্টক আপডেট করে (কন্ট্রোলারের লজিক অনুযায়ী)।

Body (example):

```json
{
  "items": [{ "product": "productObjectId", "quantity": 2 }],
  "shippingAddress": { "street": "House 1", "city": "Dhaka", "postalCode": "1207", "country": "Bangladesh" },
  "billingAddress": { "street": "House 1", "city": "Dhaka", "postalCode": "1207", "country": "Bangladesh" },
  "paymentMethod": "cod",
  "couponCode": "SAVE10"
}
```

Payment methods: `card`, `cod`, `bank`, `manual`

Notes:
- Shipping cost: subtotal <= 150 -> 5, else -> 0
- `card` payment creates `paymentStatus: paid`
- `manual` payment sets `orderStatus: pending_verification`

Response: created order object

2. 📦 My Orders (GET)

URL: `/api/orders/my-orders`
Method: GET
Access: Private
Description: বর্তমান লগইন করা গ্রাহকের অর্ডার ইতিহাস রিটার্ন করে।

3. 🔎 Get Order Details (GET)

URL: `/api/orders/:id`
Method: GET
Access: Private
Description: গ্রাহক নিজের অর্ডার দেখবে; admin/manager সব অর্ডার দেখতে পারবে (authorize logic কন্ট্রোলার-এ আছে)।

4. 📚 Get All Orders (GET)

URL: `/api/orders`
Method: GET
Access: Private (roles: `admin`, `manager`)
Description: সকল অর্ডারের তালিকা (ড্যাশবোর্ড ব্যবহারের জন্য)।

5. 🔄 Update Order Status (PUT)

URL: `/api/orders/:id/status`
Method: PUT
Access: Private (roles: `admin`, `manager`)
Body (example):

```json
{ "orderStatus": "processing", "paymentStatus": "paid" }
```

Description: অর্ডারের স্ট্যাটাস ও পেমেন্ট স্ট্যাটাস আপডেট করা হয়। Order cancel করলে কন্ট্রোলার অনুযায়ী স্টক ফিরিয়ে দেওয়া হয়।

Allowed orderStatus values: `pending, pending_verification, processing, shipped, delivered, cancelled`
Allowed paymentStatus values: `pending, paid, failed`

---

## Review APIs

1. 💬 Get Product Reviews (GET)

URL: `/api/reviews/product/:productId`
Method: GET
Access: Public
Description: একটি প্রোডাক্টের সকল রিভিউ তালিকা রিটার্ন করে।

2. ✍️ Add Review (POST)

URL: `/api/reviews/:productId`
Method: POST
Access: Private
Body:

```json
{ "rating": 5, "comment": "Very good product" }
```

Description: লগইন করা ইউজার একটি প্রোডাক্টে রিভিউ যোগ করতে পারে; একই ইউজার একই প্রোডাক্টে একবারই রিভিউ দিতে পারবে (কন্ট্রোলারে logic আছে)। Rating 1 থেকে 5

3. 🧹 Delete Review (DELETE)

URL: `/api/reviews/:id`
Method: DELETE
Access: Private
Description: রিভিউ মালিক বা admin এই রিভিউ মুছে দিতে পারবে।

---

## Admin APIs

1. 📊 Dashboard Stats (GET)

URL: `/api/admin/stats`
Method: GET
Access: Private (roles: `admin`, `manager`)
Description: মোট রেভেনিউ (paid orders), মোট অর্ডার, মোট প্রোডাক্ট, মোট গ্রাহক, low stock count, total investments ইত্যাদি রিটার্ন করে।

2. 📈 Dashboard Charts (GET)

URL: `/api/admin/charts`
Method: GET
Access: Private (roles: `admin`, `manager`)
Description: গত ৬ মাসের রেভেনিউ চার্ট, ক্যাটেগরি অনুযায়ী সেলস চার্ট, অর্ডার স্ট্যাটাস চার্ট রিটার্ন করে।

3. 👥 Get Users (GET)

URL: `/api/admin/users`
Method: GET
Access: Private (role: `admin`)
Description: সকল ইউজার তালিকা রিটার্ন করে।

4. 🔧 Update User Role (PUT)

URL: `/api/admin/users/:id/role`
Method: PUT
Access: Private (role: `admin`)
Body (example):

```json
{ "role": "manager", "investmentAmount": 5000 }
```

Description: ইউজারের role এবং investmentAmount আপডেট করা হয়। Allowed roles: `customer, manager, admin`

---

## Validation এবং নিরাপত্তা নোট

- Product GET query এবং Create/Update body-র জন্য সার্ভার সাইটে ইনপুট ভ্যালিডেশন যোগ করা হয়েছে (search escape, numeric parse, page/limit cap, allowed sort whitelist, basic create/update checks)。
- User-provided regex ব্যবহার করার আগে special characters ইস্কেপ করা হয় যাতে ReDoS ঝুঁকি কমে。
- বড় ডাটাবেসের জন্য index ও full-text search বিবেচনা করুন — current search regex ঐগুলো ছাড়াই slow হতে পারে。
- Authentication middleware: token cookie অথবা Bearer header থেকে নেয়া হয়; রোল চেক `authorize(...)` middleware দিয়ে করে।

---

## Common Error Response

Most errors নিম্ন ফরম্যাটে রিটার্ন করবে:

```json
{ "success": false, "message": "Error message" }
```

Common status codes:

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation issue |
| `401` | Token missing or invalid |
| `403` | Role permission denied |
| `404` | Resource not found |
| `500` | Server error |

---

এখানে করা পরিবর্তনসমূহ (সংক্ষিপ্ত):

- কোডবেইসের অনুকূলে ডকসকে পরিষ্কার ও প্রফেশনাল ফরম্যাটে লিখে রাখা হয়েছে。
- Product GET query এবং Product create/update সম্পর্কিত ভ্যালিডেশনের কথা যোগ করা হয়েছে (ইনপুট স্যানিটাইজেশন ও টাইপ চেক সম্পর্কে)。
- Delete Product behaviour (soft-delete) স্পষ্ট করা হয়েছে।

কোনো নির্দিষ্ট এন্ডপয়েন্টের response উদাহরণ বা অতিরিক্ত ফিল্ড ডকুমেন্টেশন লাগলে বলুন — আমি যুক্ত করে দিব।
