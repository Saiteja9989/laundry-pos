"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, Package, Truck, Shirt } from "lucide-react";

interface Order {
  orderId: string;
  customer: { name: string; phone: string };
  itemsSummary: string;
  primaryService: string;
  total: number;
  status: string;
  createdAt: string;
}

const steps = [
  { key: "Pending",    label: "Order Received",   icon: Clock,        desc: "Your clothes have been dropped off." },
  { key: "Processing", label: "In Processing",     icon: Package,      desc: "We are washing/cleaning your clothes." },
  { key: "Ready",      label: "Ready for Pickup",  icon: CheckCircle,  desc: "Your order is ready! Please collect at the shop." },
  { key: "Delivered",  label: "Delivered",         icon: Truck,        desc: "Order completed. Thank you!" },
];

const statusIndex = (status: string) => steps.findIndex((s) => s.key === status);

export default function TrackPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    params.then(({ orderId }) => {
      setOrderId(orderId);
      fetch(`/api/orders/${orderId}`)
        .then((r) => r.json())
        .then((data) => { setOrder(data); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading order...</div>
      </div>
    );
  }

  if (!order || order.orderId === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Order <span className="font-mono font-bold">{orderId}</span> not found.</p>
        </div>
      </div>
    );
  }

  const currentStep = statusIndex(order.status);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full mb-4">
            <Shirt className="w-4 h-4" />
            <span className="text-sm font-medium">Quick Dry Cleaning, Hyderabad</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono">{order.orderId}</p>
        </div>

        {/* Order Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-bold text-gray-900">{order.customer.name}</p>
              <p className="text-xs text-gray-500">{order.itemsSummary}</p>
              <p className="text-xs text-gray-400">{order.primaryService}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">₹{order.total}</p>
              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      active ? "bg-black text-white ring-4 ring-black/10" :
                      done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-10 mt-1 ${done && i < currentStep ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pb-10 pt-1.5">
                    <p className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    {active && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          For queries, call Quick Dry Cleaning Hyderabad
        </p>
      </div>
    </div>
  );
}
