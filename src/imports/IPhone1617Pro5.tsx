function TitleCard() {
  return (
    <div className="bg-[#f7f7f7] h-[287px] relative rounded-[32px] shrink-0 w-full" data-name="Title card">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <div className="size-full" />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[24px] items-start left-[24px] top-[-53px] w-[354px]">
      <TitleCard />
      <div className="bg-[#f7f7f7] h-[499px] relative rounded-[32px] shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      </div>
      <div className="bg-[#f7f7f7] h-[499px] relative rounded-[32px] shrink-0 w-full">
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      </div>
    </div>
  );
}

function ToggleMobile() {
  return <div className="bg-[#f2f2f2] h-[37px] rounded-[88px] shrink-0 w-[106px]" data-name="Toggle - mobile" />;
}

function ToggleMobile1() {
  return <div className="bg-[#121111] h-[37px] rounded-[88px] shrink-0 w-[106px]" data-name="Toggle - mobile" />;
}

function ToggleMobile2() {
  return <div className="bg-[#f2f2f2] h-[37px] rounded-[88px] shrink-0 w-[106px]" data-name="Toggle - mobile" />;
}

function ToggleMobile3() {
  return <div className="bg-[#f2f2f2] h-[37px] rounded-[88px] shrink-0 w-[106px]" data-name="Toggle - mobile" />;
}

function ToggleMobile4() {
  return <div className="bg-[#f2f2f2] h-[37px] rounded-[88px] shrink-0 w-[106px]" data-name="Toggle - mobile" />;
}

function ProjectToggles() {
  return (
    <div className="absolute content-center flex flex-wrap gap-[6px] items-center left-[-86px] top-[77px] w-[1146px]" data-name="Project toggles">
      <ToggleMobile />
      <ToggleMobile1 />
      <ToggleMobile2 />
      <ToggleMobile3 />
      <ToggleMobile4 />
    </div>
  );
}

export default function IPhone1617Pro() {
  return (
    <div className="bg-white relative size-full" data-name="iPhone 16 & 17 Pro - 5">
      <Frame />
      <div className="absolute bg-white border-[rgba(0,0,0,0.03)] border-b border-solid h-[129px] left-0 top-0 w-[402px]" />
      <p className="absolute font-['Alliance_No.1:Light',sans-serif] leading-[normal] left-[24px] not-italic text-[22px] text-black top-[32px] tracking-[-1.1px] w-[311px] whitespace-pre-wrap">Ben Suárez</p>
      <ProjectToggles />
    </div>
  );
}