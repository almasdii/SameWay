const TestimonialsSection = ({testimonials}) => {
    return(
         <div className="py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            What our customers are saying
                        </h2>
                        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                            Hear from those who have experienced our service firsthand.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-8 lg:grid-cols-3">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-4">
                                    <img className="h-12 w-12 rounded-full object-cover" src={testimonial.image} alt={`${testimonial.name}'s avatar`} />
                                    <div className="ml-4">
                                        <p className="text-lg font-semibold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </div>
                                <p className="text-gray-700">{testimonial.quote}</p>
                            </div>
                        ))}
                    </div>
            </div>
        </div>
    )
}
export default TestimonialsSection;