# Tenant Theming + Layout Builder

Mall admins can manage tenant-specific theming via:
- `GET /mall-admin/theme`
- `PUT /mall-admin/theme`
- `POST /mall-admin/layout/snapshot`

Theme payload supports:
- branding colors (`primary`, `secondary`, `accent`)
- typography (`font`)
- radius preset (`sm|md|lg`)
- ordered homepage module list (`layoutDraft`)

Validation:
- update rejected when required color fields are missing.
- tenant ownership is enforced by tenant guard + mall_admin role.
