import { useNavigate } from "react-router-dom";
const PricingSection = ({ pricingPlans  }) => {
      const navigate = useNavigate();
    return(
        <div className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Choose the plan that fits your needs
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                        Whether you're just starting out or need advanced features, we have a plan for you.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 lg:grid-cols-3">
                    {pricingPlans.map((plan, index) => (
                        <div key={index} className={`border rounded-lg shadow-sm p-6 flex flex-col bg-white hover:bg-blue-50 transition-colors duration-300 ${plan.featured ? 'border-blue-500 shadow-lg' : 'hover:shadow-md border-gray-200 '}`}>
                            <h3 className="text-xl font-semibold text-gray-900">{plan.title}</h3>
                            <p className="mt-4 text-gray-500">{plan.info}</p>
                            <div className="mt-6 flex items-baseline text-gray-900">
                                <span className="text-3xl font-extrabold">${plan.cost}</span>
                                <span className="ml-1 text-xl font-medium text-gray-500">/month</span>
                            </div>
                            <ul className="mt-6 space-y-4 flex-1">
                                {plan.perks.map((perk, perkIndex) => (
                                    <li key={perkIndex} className="flex items-start">
                                        <svg className="shrink-0 h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <p className="ml-3 text-base text-gray-700">{perk}</p>
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate("/register")} className={`mt-6 w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-800 hover:bg-blue-900`}>
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
export default PricingSection;