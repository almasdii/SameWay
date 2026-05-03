import { useNavigate } from "react-router-dom";
const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <div className="landing-page-content relative">
            <div className="absolute inset-0 bg-linear-to-r from-purple-50 to-indigo-100 opacity-80"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-32 lg:pb-28">
                    <div className="text-center">
                        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                            <span className="block">Travel Together with</span>
                            <span className="block text-purple-500">SameWay</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                          Find, book, Accessible anywhere, anytime.
                        </p>
                        <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                            <div className="flex justify-center gap-5 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                                <button onClick={()=> navigate("/register")} className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md  text-white bg-purple-500 hover:bg-purple-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl">Get Started</button>
                                <button onClick={()=> navigate("/login")} className="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md  text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-md">Sign in</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <div className="aspect-w-16 rounded-4xl overflow-hidden ">
                        <img src="sameway.jpg" alt="Cloud Storage" className="object-cover w-full h-full" />
                    </div>
                    <div className="absolute inset-0 bg-linear-to-t from-black opacity-10 rounded-lg"></div>
                </div>
                <div className="mt-8 text-center">
                    <p className="mt-4 pb-4 text-base text-gray-500">
                       Connecting drivers with people on the same path. Set your destination, create trips, and journey together
                    </p>
                </div>
            </div>
        </div>
    )
}

export default HeroSection;