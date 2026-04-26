'use client';

import { forwardRef } from 'react';

interface PrintableTicketProps {
  order: {
    id: string;
    displayNumber?: string;
    status: string;
    createdAt: string;
    table: { tableNumber: number };
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      note?: string;
      menuItem: { name: string };
      options?: { optionName: string; optionPrice: number }[];
    }[];
    subTotal?: number;
    vatAmount?: number;
    serviceChargeAmount?: number;
    totalPrice: number;
    notes?: string;
  };
}

export const PrintableTicket = forwardRef<HTMLDivElement, PrintableTicketProps>(
  function PrintableTicket({ order }, ref) {
    const time = new Date(order.createdAt).toLocaleString('en-ET', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="printable-ticket hidden print:block"
        style={{
          width: '80mm',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '12px',
          color: '#000',
          padding: '4mm',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
            SMART MENU
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>Kitchen Order Ticket</div>
          <div
            style={{
              borderBottom: '2px dashed #000',
              margin: '6px 0',
            }}
          />
        </div>

        {/* Order Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '22px' }}>
            #{order.displayNumber || order.id.slice(0, 6).toUpperCase()}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            T-{order.table.tableNumber}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px' }}>{time}</div>

        <div style={{ borderBottom: '1px dashed #999', margin: '6px 0' }} />

        {/* Items */}
        {(order.items || []).map((item) => (
          <div key={item.id} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>
                {item.quantity}x {item.menuItem.name}
              </span>
              <span>{(item.unitPrice * item.quantity).toFixed(0)}</span>
            </div>
            {item.options && item.options.length > 0 && (
              <div style={{ paddingLeft: '12px', fontSize: '10px', color: '#555' }}>
                {item.options.map((opt, oi) => (
                  <div key={oi}>
                    + {opt.optionName}
                    {opt.optionPrice > 0 ? ` (${opt.optionPrice.toFixed(0)})` : ''}
                  </div>
                ))}
              </div>
            )}
            {item.note && (
              <div style={{ paddingLeft: '12px', fontSize: '10px', fontStyle: 'italic', color: '#666' }}>
                Note: {item.note}
              </div>
            )}
          </div>
        ))}

        <div style={{ borderBottom: '1px dashed #999', margin: '8px 0' }} />

        {/* Totals */}
        <div style={{ fontSize: '11px' }}>
          {order.subTotal !== undefined && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>{Number(order.subTotal).toFixed(0)}</span>
            </div>
          )}
          {order.serviceChargeAmount !== undefined && order.serviceChargeAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Service</span>
              <span>{Number(order.serviceChargeAmount).toFixed(0)}</span>
            </div>
          )}
          {order.vatAmount !== undefined && order.vatAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>VAT</span>
              <span>{Number(order.vatAmount).toFixed(0)}</span>
            </div>
          )}
        </div>

        <div style={{ borderBottom: '2px dashed #000', margin: '6px 0' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '16px',
          }}
        >
          <span>TOTAL</span>
          <span>ETB {Number(order.totalPrice).toFixed(0)}</span>
        </div>

        {order.notes && (
          <>
            <div style={{ borderBottom: '1px dashed #999', margin: '6px 0' }} />
            <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Note: {order.notes}</div>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '9px', color: '#999' }}>
          <div>Thank you for dining with us!</div>
          <div>Powered by ArifSmart Menu</div>
        </div>
      </div>
    );
  },
);
