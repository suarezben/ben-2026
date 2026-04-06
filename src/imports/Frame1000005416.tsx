import svgPaths from "./svg-n04uqh8y17";
const imgScreenshot20260220At30321Pm1 =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14'%3EPlaceholder%3C/text%3E%3C/svg%3E";

function Frame() {
  return (
    <div className="content-stretch flex flex-col font-['Alliance_No.1:Regular',sans-serif] gap-[2px] h-[69px] items-start leading-[normal] relative shrink-0 w-full whitespace-pre-wrap">
      <p className="relative shrink-0 text-[24px] text-black tracking-[-1.2px] w-full">Aiden Coffee Maker</p>
      <p className="flex-[1_0_0] min-h-px min-w-px relative text-[20px] text-[rgba(0,0,0,0.4)] tracking-[-1px] w-full">Interface and interaction design</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
      <div className="flex flex-col font-['Inter:Semi_Bold',sans-serif] font-semibold justify-end leading-[0] relative shrink-0 text-[16px] text-[rgba(0,0,0,0.8)] w-full">
        <p className="leading-[22px] whitespace-pre-wrap">2024</p>
      </div>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[14px] text-[rgba(0,0,0,0.4)] w-full whitespace-pre-wrap">For the last I’ve been working with Fellow lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis .</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[17px] items-start not-italic relative shrink-0 w-full">
      <Frame />
      <Frame1 />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[0_0_-0.01%_0]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 120.002 24.75">
        <g id="Group">
          <path d={svgPaths.p1a3e3f32} fill="var(--fill-0, black)" id="Vector" />
          <path d={svgPaths.p24c9300} fill="var(--fill-0, black)" id="Vector_2" />
          <path d={svgPaths.p37125b00} fill="var(--fill-0, black)" id="Vector_3" />
          <path d={svgPaths.p15292bd0} fill="var(--fill-0, black)" id="Vector_4" />
          <path d={svgPaths.p2105b900} fill="var(--fill-0, black)" id="Vector_5" />
          <path d={svgPaths.p307e8700} fill="var(--fill-0, black)" id="Vector_6" />
          <path d={svgPaths.pc802b00} fill="var(--fill-0, black)" id="Vector_7" />
        </g>
      </svg>
    </div>
  );
}

function Logo() {
  return (
    <div className="content-stretch flex flex-col items-start p-[10px] relative shrink-0 w-[141.664px]" data-name="Logo">
      <div className="h-[25.092px] overflow-clip relative shrink-0 w-full" data-name="Fellow-logo-lockup">
        <Group />
      </div>
    </div>
  );
}

export default function Frame3() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute bg-[#f7f7f7] content-stretch flex flex-col h-[489px] items-start justify-between left-[65px] p-[18px] rounded-[32px] top-[97px] w-[407px]" data-name="Title card">
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
        <Frame2 />
        <Logo />
      </div>
      <div className="absolute h-[569px] left-[525px] top-[76px] w-[462px]" data-name="Screenshot 2026-02-20 at 3.03.21 PM 1">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgScreenshot20260220At30321Pm1} />
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[201px] not-italic text-[16.976px] text-black top-[672px] tracking-[-0.8488px]">Intent</p>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[785px] not-italic text-[#ee6868] text-[16.976px] top-[672px] tracking-[-0.8488px]">AI</p>
    </div>
  );
}