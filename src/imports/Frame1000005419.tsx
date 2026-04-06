const imgFrame1000005418 =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3EPlaceholder%3C/text%3E%3C/svg%3E";

export default function Frame() {
  return (
    <div className="content-stretch flex items-center p-[10px] relative size-full">
      <div className="h-[1402px] relative shrink-0 w-[658px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute left-0 max-w-none size-full top-0" src={imgFrame1000005418} />
        </div>
      </div>
    </div>
  );
}