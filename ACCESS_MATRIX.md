# Access matrix: pages and actions by department/role

Use this to decide who sees which pages and which API actions are allowed. Access is controlled by **department** (and optionally role name where we need finer control). No Permission model — rules in code.

---

## Departments (current)

| Department | Purpose |
|------------|--------|
| **admin** | Full ops: users, warehouses, vendors, general (depts/roles), products, orders, support, reporting |
| **vendor** | Add/edit products and variants for their vendor; view orders (their vendor's) |
| **support** | Tickets (raise, manage); maybe read orders for context |
| **delivery** | Orders (assign, update status); team, history |

---

## Pages (frontend routes)

| Route | Description | Admin | Vendor | Support | Delivery |
|-------|-------------|:-----:|:------:|:-------:|:--------:|
| `/` | Home (redirects to dashboard) | ✓ | ✓ | ✓ | ✓ |
| `/login` | Login | ✓ | ✓ | ✓ | ✓ |
| `/dashboards/admin` | Admin dashboard | ✓ | — | — | — |
| `/dashboards/vendor` | Vendor dashboard | ✓ | ✓ | — | — |
| `/dashboards/support` | Support dashboard | ✓ | — | ✓ | — |
| `/dashboards/delivery` | Delivery dashboard | ✓ | — | — | ✓ |
| `/users` | List users | ✓ | — | — | — |
| `/users/add` | Add user | ✓ | — | — | — |
| `/users/edit/[id]` | Edit user | ✓ | — | — | — |
| `/warehouse` | List warehouses | ✓ | — | — | — |
| `/warehouse/add` | Add warehouse | ✓ | — | — | — |
| `/warehouse/edit/[id]` | Edit warehouse | ✓ | — | — | — |
| `/vendor` | List vendors (vendor entities) | ✓ | — | — | — |
| `/vendor/add` | Add vendor | ✓ | — | — | — |
| `/vendor/edit/[id]` | Edit vendor | ✓ | — | — | — |
| `/genral` | Departments & roles (General) | ✓ | — | — | — |
| `/products` | List products | ✓ | ✓ (own vendor only) | — | — |
| `/products/add` | Add product | ✓ | ✓ (own vendor only) | — | — |
| `/products/[id]` | View product | ✓ | ✓ (own vendor only) | — | — |
| `/products/edit/[id]` | Edit product | ✓ | ✓ (own vendor only) | — | — |
| `/users/userReporting` | User reporting | ✓ | — | — | — |
| `/orders` | Orders (placeholder) | ✓ | ✓ (read?) | ✓ (read?) | ✓ (read/write) |
| `/tickets` | Tickets (to be built) | ✓ | — | ✓ | — |
| `/Team` | Team (placeholder) | — | ✓ | ✓ | ✓ |
| `/History` | History (placeholder) | — | ✓ | ✓ | ✓ |

**Legend:** ✓ = allow, — = no access.

---

## API actions (backend routes)

Who can call what. Today everything behind `adminAuth` is admin-only. After changes: use department (and role) so vendor/support/delivery get the right access.

| API area | Action | Admin | Vendor | Support | Delivery |
|----------|--------|:-----:|:------:|:-------:|:--------:|
| **auth** | login, logout, register, /me | ✓ | ✓ | ✓ | ✓ |
| **user** | list, create, get, update, delete, all | ✓ | — | — | — |
| **warehouse** | list, create, update, delete, members | ✓ | — | — | — |
| **vendor** | list, create, get, update, delete | ✓ | — | — | — |
| **department** | list, create, get, update, delete | ✓ | — | — | — |
| **role** | list, create, delete (update?) | ✓ | — | — | — |
| **category** | list, create, update, delete | ✓ | ✓ (read only?) | — | — |
| **subcategory** | list, create, update, delete | ✓ | ✓ (read only?) | — | — |
| **product** | list, get, add, update, delete | ✓ | ✓ (list/get/add/update own vendor; delete?) | — | — |
| **user-reporting** | list, create, check, get, update, delete | ✓ | — | — | — |
| **reversegeocode** | get | ✓ | ✓ | ✓ | ✓ |
| **orders** (future) | list, get, create, update, assign | ✓ | read? | read? | read + update status |
| **tickets** (future) | list, get, create, update, assign | ✓ | — | ✓ | — |

**Vendor product scope:** When user is vendor, product list/create/update must be scoped to their `vendorId` (add `vendorId` on User for vendor users).

---

## Notes for implementation

1. **Admin:** Keep current behaviour; admin role/department gets full access to all pages and APIs.
2. **Vendor:** Need to add `vendorId` to User (or link user to vendor) so product APIs can filter/restrict by vendor. Category/subcategory: vendor likely only needs read for dropdowns when adding products.
3. **Support:** Only needs ticket routes + tickets page; optionally read-only orders. No users, warehouses, vendors, general, product CRUD.
4. **Delivery:** Orders (and related) only; no users, warehouses, vendors, general, products.
5. **Route guard (frontend):** Redirect to `/dashboards/{department}` if user hits a page their department is not allowed to see.
6. **Backend middleware:** Add e.g. `requireDepartments(['admin', 'vendor'])` for product routes; `requireDepartments(['admin'])` for user/warehouse/vendor/department/role/reporting; keep auth and /me for all authenticated users.

---

## To finalise

- [ ] Confirm which roles exist per department (e.g. Admin, Vendor Manager, Support Agent, Delivery Agent) if we need role-level differences later.
- [ ] Orders: read for vendor/support or not?
- [ ] Product delete: allow vendor to delete their own products or admin only?
- [ ] Category/subcategory: vendor write access or read-only?
- [ ] Team / History: define real routes and access when those features are built.

Once this is agreed, we can implement route guards and backend middleware accordingly.
