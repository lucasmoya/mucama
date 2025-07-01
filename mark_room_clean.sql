CREATE OR REPLACE FUNCTION mark_room_clean(
  p_room_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
DECLARE
  linen RECORD;
BEGIN
  FOR linen IN
    SELECT * FROM room_linen_config WHERE room_id = p_room_id
  LOOP
    -- 1. Recoger ropa sucia: mover de in_use a dirty
    UPDATE inventory_stock
      SET in_use_stock = in_use_stock - linen.quantity,
          dirty_stock = dirty_stock + linen.quantity
      WHERE catalog_item_id = linen.catalog_item_id;

    INSERT INTO inventory_movements (
      catalog_item_id,
      movement_type,
      from_status,
      to_status,
      quantity,
      room_id,
      user_id,
      created_at
    ) VALUES (
      linen.catalog_item_id,
      'collect_dirty',
      'in_use',
      'dirty',
      linen.quantity,
      p_room_id,
      p_user_id,
      NOW()
    );

    -- 2. Entregar ropa limpia: mover de available a in_use
    UPDATE inventory_stock
      SET available_stock = available_stock - linen.quantity,
          in_use_stock = in_use_stock + linen.quantity
      WHERE catalog_item_id = linen.catalog_item_id;

    INSERT INTO inventory_movements (
      catalog_item_id,
      movement_type,
      from_status,
      to_status,
      quantity,
      room_id,
      user_id,
      created_at
    ) VALUES (
      linen.catalog_item_id,
      'deliver_clean',
      'available',
      'in_use',
      linen.quantity,
      p_room_id,
      p_user_id,
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql; 