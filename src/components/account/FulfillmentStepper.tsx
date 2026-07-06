const STEPS = [
  { key: "queued", label: "در صف انجام" },
  { key: "logging_in", label: "در حال ورود به اکانت" },
  { key: "processing", label: "در حال واریز/انجام" },
  { key: "completed", label: "تکمیل شده" },
];

export default function FulfillmentStepper({ status }: { status: string }) {
  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.key === status));
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      {STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-full ${idx <= currentIndex ? "bg-brand-sabz" : "bg-brand-surface_hover"}`} title={step.label} />
          {idx < STEPS.length - 1 && <div className={`w-4 h-[2px] ${idx < currentIndex ? "bg-brand-sabz" : "bg-brand-surface_hover"}`} />}
        </div>
      ))}
      <span className="text-[11px] text-brand-m_khonsa mr-2" dir="rtl">{STEPS[currentIndex]?.label}</span>
    </div>
  );
}