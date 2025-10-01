const Header: React.FC = () => (
  <div className="text-center p-6 bg-gray-800 rounded-lg shadow-xl">
    <div className="flex items-center justify-center space-x-2 text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span className="text-sm">INVESTMENT TRACKER</span>
    </div>
    <h1 className="text-5xl font-bold text-white mt-2">My portfolio</h1>
    <p className="text-xl text-gray-300 mt-1">At a glance</p>
  </div>
);

export default Header;
