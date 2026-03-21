import { Link } from "react-router-dom";

const emergencyTypes = [
  { icon: "🏥", label: "Medical", description: "Medical emergencies and healthcare support" },
  { icon: "🍽️", label: "Food", description: "Food assistance and nutrition aid" },
  { icon: "🚨", label: "Rescue", description: "Emergency rescue and evacuation" },
  { icon: "🏠", label: "Shelter", description: "Temporary shelter and housing support" },
];

const HomePage = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Coordinating Emergency Response for Ugandan Communities
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          CommunityAid connects people in need with volunteers, donors, and
          responders. Post emergency requests, offer help, and track aid in real
          time — even when connectivity is limited.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/requests"
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
          >
            View Requests
          </Link>
          <Link
            to="/requests"
            className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-md text-base font-medium hover:bg-blue-50 transition-colors"
          >
            Post a Request
          </Link>
        </div>
      </section>

      {/* Emergency type cards */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-8">
          Types of Emergency Support
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {emergencyTypes.map(({ icon, label, description }) => (
            <div
              key={label}
              className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-3">{icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {label}
              </h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
