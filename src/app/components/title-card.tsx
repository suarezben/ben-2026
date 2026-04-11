interface TitleCardProps {
  company: string;
  role: string;
  year: string;
}

export function TitleCard({ company, role, year }: TitleCardProps) {
  return (
    <div className="flex-shrink-0 md:w-[407px] w-full select-none">
      <div className="bg-[#f7f7f7] border border-[rgba(0,0,0,0.03)] border-solid rounded-[32px] md:h-[499px] h-[287px] p-8 md:p-12 flex flex-col justify-between">
        <div>
          <h2 className="font-['Alliance_No.1',sans-serif] font-light text-[32px] md:text-[48px] text-[#121111] tracking-[-1.6px] md:tracking-[-2.4px] mb-4">
            {company}
          </h2>
          <p className="font-['Inter',sans-serif] font-normal text-[18px] md:text-[22px] text-[rgb(18_17_17/0.7)] tracking-[-0.9px] md:tracking-[-1.1px]">
            {role}
          </p>
        </div>
        <div>
          <p className="font-['Inter',sans-serif] font-normal text-[16px] md:text-[18px] text-[rgb(18_17_17/0.5)]">
            {year}
          </p>
        </div>
      </div>
    </div>
  );
}