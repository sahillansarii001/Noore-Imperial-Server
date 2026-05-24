export const generateInvoice = (order, items, user, address) => {
  // 18% GST split into 9% CGST and 9% SGST
  const gstRate = 0.18;
  const subtotal = order.subtotal;
  
  // Assuming the subtotal is exclusive of tax for invoice calculation purposes
  // Or if it's inclusive, we calculate backwards.
  // The instructions specify: "Build invoice object with GST breakdown (18% GST split as 9% CGST + 9% SGST)."
  // We'll calculate it based on subtotal.
  
  const taxAmount = Math.round(subtotal * gstRate);
  const cgstAmount = Math.round(taxAmount / 2);
  const sgstAmount = Math.round(taxAmount / 2);

  const invoice = {
    invoice_number: `INV-${order.id.split('-')[0].toUpperCase()}`,
    date: new Date(order.created_at).toISOString().split('T')[0],
    order_id: order.id,
    customer: {
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    shipping_address: {
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    },
    items: items.map(item => ({
      name: item.product_name, // assumes joined from products
      variant: item.size ? `${item.size} / ${item.color}` : null,
      quantity: item.quantity,
      unit_price: item.price,
      total: item.price * item.quantity
    })),
    summary: {
      subtotal: subtotal,
      discount: order.discount,
      shipping_fee: order.shipping_fee,
      cgst_9_percent: cgstAmount,
      sgst_9_percent: sgstAmount,
      total_tax: order.tax, // Could be cgstAmount + sgstAmount
      total: order.total
    },
    payment_method: order.payment_method,
    payment_status: order.payment_status
  };

  return invoice;
};
