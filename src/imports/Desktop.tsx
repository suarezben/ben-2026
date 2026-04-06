function Frame6() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px]">Meta Reality Labs</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-black content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-center text-white tracking-[-1.0383px]">Fellow</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px]">General Collaboration</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px] w-[64.896px] whitespace-pre-wrap">Ghost</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px]">Sutter Hill Ventures</p>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px] w-[64.896px] whitespace-pre-wrap">Lyft</p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px] w-[64.896px] whitespace-pre-wrap">Twitter</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[rgba(0,0,0,0.05)] content-stretch flex items-center justify-center px-[13.845px] py-[10.383px] relative rounded-[85.663px] shrink-0">
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[20.767px] text-black text-center tracking-[-1.0383px]">Periscope</p>
    </div>
  );
}

function ProjectToggles() {
  return (
    <div className="content-center flex flex-wrap gap-[6px] items-center relative shrink-0 w-[630px]" data-name="Project toggles">
      <Frame6 />
      <Frame />
      <Frame1 />
      <Frame7 />
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame5 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[1029px]">
      <div className="font-['Alliance_No.1:Light',sans-serif] leading-[normal] min-w-full not-italic relative shrink-0 text-[42px] text-black tracking-[-2.1px] w-[min-content] whitespace-pre-wrap">
        <p className="mb-0">My name is Ben Suárez.</p>
        <p>I’m a designer living in San Francisco.</p>
      </div>
      <ProjectToggles />
    </div>
  );
}

function TitleCard() {
  return (
    <div className="bg-[#f7f7f7] h-full relative rounded-[32px] shrink-0 w-[407px]" data-name="Title card">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
    </div>
  );
}

function Frame11() {
  return (
    <div className="h-full relative shrink-0 w-[705px]">
      <div className="absolute bg-[#f7f7f7] border border-[rgba(0,0,0,0.03)] border-solid h-[499px] left-0 rounded-[32px] top-0 w-[705px]" />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[30px] h-[499px] items-center relative shrink-0 w-full">
      <TitleCard />
      <Frame11 />
      <div className="bg-[#f7f7f7] h-full relative rounded-[32px] shrink-0 w-[705px]">
        <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.03)] border-solid inset-0 pointer-events-none rounded-[32px]" />
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[40px] items-start left-[90px] top-[132px]">
      <Frame9 />
      <Frame8 />
    </div>
  );
}

export default function Desktop() {
  return (
    <div className="bg-white relative size-full" data-name="Desktop">
      <Frame10 />
    </div>
  );
}