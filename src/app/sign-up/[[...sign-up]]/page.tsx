import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-3.447 10-9 10S3 19.075 3 13c0-.37.022-.734.065-1.092L12 14z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Teacher Portal — Create your account</p>
      </div>
      <SignUp />
    </div>
  );
}
