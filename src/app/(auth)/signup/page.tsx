import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "회원가입 | 고구마마켓" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-extrabold text-ink">고구마마켓 시작하기</h1>
      <p className="mb-6 mt-1 text-center text-sm text-ink-soft">
        30초면 끝나요. 우리 동네 따끈한 거래 🍠
      </p>
      <SignupForm />
    </>
  );
}
