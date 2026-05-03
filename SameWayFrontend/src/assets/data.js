export const features = [
  {
    
    iconName: "MapPin", 
    iconColor: "text-purple-500",
    title: "Route Creation", // Создание маршрута
    description: "Easily set your origin, destination, and intermediate stops for your journey.",
  },
  {
   
    iconName: "Users",
    iconColor: "text-green-500",
    title: "Passenger Management", // Управление пассажирами
    description: "Review booking requests and manage who travels with you securely.",
  },
  {
   
    iconName: "CalendarDays", 
    iconColor: "text-purple-500",
    title: "Trip Scheduling", // Планирование поездок
    description: "Set your departure date, time, and available seats for optimal planning.",
  },
  {
    iconName: "Wallet",
    iconColor: "text-orange-500",
    title: "Split Costs", 
    description: "Set a fair price per seat and share travel expenses with passengers easily.",
  },
  {
    
    iconName: "Car",
    iconColor: "text-red-500",
    title: "Vehicle Fleet", 
    description: "Register and manage multiple cars in your profile for different trips.",
  },
  {
    
    iconName: "History",
    iconColor: "text-indigo-500",
    title: "Trip History", 
    description: "Track all your past and upcoming journeys and bookings in one place.",
  },
];




export const plans = [
  {
    title: "Casual",
    cost: "0",
    info: "Ideal for occasional travelers",
    perks: [
      "Up to 2 active trips",
      "Standard search priority",
      "Manage 1 vehicle",
      "Basic trip history",
    ],
    buttonText: "Stay Free",
    featured: false,
  },
  {
    title: "Voyager",
    cost: "500",
    info: "Perfect for daily commuters",
    perks: [
      "Up to 10 active trips",
      "Higher search visibility",
      "Manage up to 3 vehicles",
      "Advanced trip analytics",
      "Priority email support",
    ],
    buttonText: "Upgrade to Voyager",
    featured: true,
  },
  {
    title: "Fleet",
    cost: "2500",
    info: "For professional coordinators",
    perks: [
      "Unlimited active trips",
      "Top placement in searches",
      "Unlimited vehicle fleet",
      "Real-time route optimization",
      "24/7 dedicated support",
      "Developer API access",
    ],
    buttonText: "Get Fleet",
    featured: false,
  },
];


export const testimonials = [
  {
    name: "Aruzhan Serikova",
    role: "SDU Student",
    company: "Daily Commuter",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "SameWay completely changed how I get to university. Finding a ride is so much faster than waiting for a bus, and it's great to meet fellow students along the way.",
    rating: 5,
  },
  {
    name: "Arman Bolatov",
    role: "Junior Java Developer",
    company: "Tech Lead",
    image: "https://randomuser.me/api/portraits/men/52.jpg",
    quote:
      "I use SameWay to share my daily commute to the office. It's effortless to list my empty seats, and splitting the fuel costs has saved me a lot of money every month.",
    rating: 5,
  },
  {
    name: "Elena Ivanova",
    role: "Project Manager",
    company: "Freelance",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "Planning intercity trips from Almaty used to be chaotic. With SameWay, everything from booking a seat to tracking the trip history is organized and easy to manage.",
    rating: 5,
  },
];