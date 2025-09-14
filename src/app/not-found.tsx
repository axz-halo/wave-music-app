export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">페이지를 찾을 수 없어요</h2>
        <p className="text-sm text-gray-600">요청하신 페이지가 존재하지 않습니다.</p>
      </div>
    </div>
  );
}


