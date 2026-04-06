import svgPaths from "./svg-19pugxj70m";

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

export default function TitleCard() {
  return (
    <div className="bg-[#f7f7f7] content-stretch flex flex-col items-start justify-between p-[18px] relative rounded-[32px] size-full" data-name="Title card">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      <Frame2 />
      <Logo />
    </div>
  );
}