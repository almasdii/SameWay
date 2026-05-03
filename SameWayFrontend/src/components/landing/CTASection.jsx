import { useNavigate } from "react-router-dom";
const CTASection = () => {
      const navigate = useNavigate();
    return(
        <div className="bg-purple-500">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                    <span className="block">Ready to get started?</span>
                    <span className="block text-indigo-200">Try CloudShare today!</span>
                </h2>
                <div className="mt-8 flex lg:mt-0 lg:shrink-0">
                    <div className="inline-flex rounded-md shadow">
                        <button onClick={() => navigate("/register")} className="inline-flex items-center justify-center px-10 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-gray-100">
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default CTASection;
