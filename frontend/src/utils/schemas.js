export const EXTRACTION_SCHEMAS = {
  "inventory_on_hand": {
    "sku": {"required": true, "type": "str", "validation": "alphanumeric"},
    "quantity": {"required": true, "type": "float", "validation": "positive_numeric"},
    "location": {"required": false, "type": "str", "validation": "text"}
  },
  "sales_history": {
    "sku": {"required": true, "type": "str", "validation": "alphanumeric"},
    "time_period": {"required": true, "type": "datetime", "validation": "date"},
    "quantity": {"required": true, "type": "float", "validation": "numeric"},
    "location": {"required": false, "type": "str", "validation": "text"},
    "revenue": {"required": false, "type": "float", "validation": "numeric"},
    "channel": {"required": false, "type": "str", "validation": "text"}
  },
  "purchase_orders": {
    "purchase_order_id": {"required": true, "type": "str", "validation": "alphanumeric"},
    "sku": {"required": true, "type": "str", "validation": "alphanumeric"},
    "quantity": {"required": true, "type": "float", "validation": "positive_numeric"},
    "arrival_date": {"required": true, "type": "datetime", "validation": "date"},
    "cost": {"required": false, "type": "float", "validation": "numeric"},
    "order_date": {"required": false, "type": "datetime", "validation": "date"},
    "vendor": {"required": false, "type": "str", "validation": "text"},
    "location": {"required": false, "type": "str", "validation": "text"},
    "has_arrived": {"required": false, "type": "bool", "validation": "boolean"}
  },
  "item_master": {
    "sku": {"required": true, "type": "str", "validation": "alphanumeric"},
    "category": {"required": false, "type": "str", "validation": "text"},
    "vendor": {"required": false, "type": "str", "validation": "text"},
    "price": {"required": false, "type": "float", "validation": "numeric"},
    "cost": {"required": false, "type": "float", "validation": "numeric"}
  }
};