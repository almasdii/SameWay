import { features, plans, testimonials } from "../assets/data";
import CTASection from "../components/landing/CTASection";
import FooterSection from "../components/landing/FooterSection";
import HeroSection from "../components/landing/HeroSection";
import PricingSection from "../components/landing/PricingSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import FeaturesSection from "../components/landing/FeaturesSection";


const Landing = () => {

    
    return(
        <div className="Landing-page bg-linear-to-b from-gray-50 to-gray-100">
            {/*Hero section*/}
            <HeroSection/>
            {/*Features section*/}
            <FeaturesSection features={features}/>
            {/*Pricing section*/}
            {/* <PricingSection pricingPlans={plans} /> */}
            {/*Testimonials section*/}
            <TestimonialsSection testimonials={testimonials} />
            {/*CTA section*/}
            <CTASection/>
            {/*Footer section*/}
            <FooterSection/>
        </div>
    )
}
export default Landing;
