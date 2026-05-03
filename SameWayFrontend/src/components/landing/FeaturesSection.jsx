
import { MapPin, Users, CalendarDays, Wallet, Car, History } from 'lucide-react';

const iconMap = {
  MapPin,
  Users,
  CalendarDays,
  Wallet,
  Car,
  History,
};
const FeaturesSection = ({ features }) => {
    return (
        <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Everything you need to manage your trips and passengers.
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                      SameWay provides all the tools you need to manage your journeys.
                    </p>
                </div>
             
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-16">
                        {features.map((feature, index) => {
                            const IconComponent = iconMap[feature.iconName] || Wallet;
                            return (
                                <div key={index} className="pt-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 bg-white">
                                    <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                                        <div className="mt-6">
                                            <div className={`inline-flex items-center justify-center p-3 bg-white rounded-md shadow-lg ${feature.iconColor}`}>
                                                <IconComponent size={24} />
                                            </div>
                                            <h3 className="mt-5 text-lg font-medium text-gray-900 tracking-tight">
                                                {feature.title}
                                            </h3>
                                            <p className="mt-2 text-base text-gray-500">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
         
            </div>
        </div>
    )
}

export default FeaturesSection;