import { supabase } from './supabase.js'
import { getCurrentUser, getProfile } from './auth.js'
import { computeShipping } from './utils.js'

export async function saveOrder(checkoutData, cartItems, subtotal) {
  const user = getCurrentUser()
  const ship = computeShipping(subtotal)
  const shippingCost = ship.cost
  const total = subtotal + shippingCost

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user?.id || null,
      customer_name: checkoutData.name,
      customer_email: checkoutData.email,
      customer_phone: checkoutData.phone,
      shipping_address: checkoutData.address,
      shipping_city: checkoutData.city,
      shipping_zip: checkoutData.zip,
      notes: checkoutData.notes || null,
      subtotal: subtotal,
      shipping_cost: shippingCost,
      total: total,
      status: 'pending'
    })
    .select()
    .single()

  if (orderError) throw orderError

  // Insert order items
  const items = cartItems.map(item => ({
    order_id: order.id,
    product_id: item.id,
    product_name: item.name,
    product_label: item.label || null,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items)

  if (itemsError) throw itemsError

  // Save address to profile for next time
  if (user) {
    await supabase.from('profiles').update({
      phone: checkoutData.phone,
      address: checkoutData.address,
      city: checkoutData.city,
      zip: checkoutData.zip
    }).eq('id', user.id)
  }

  return order
}

export async function getMyOrders() {
  const user = getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
