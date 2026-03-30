import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-8xl font-extrabold text-blue-100 select-none mb-2">404</p>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-slate-500 mb-8 max-w-md text-sm leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="bg-blue-600 text-white px-7 py-3 rounded-full font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
