import LeftNavBar from "../components/leftnavbar";

export default function UnionOfficers() {
    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold">Providence Holy Family Hospital</h1>
                </div>

                {/* TABS */}
                <div className="flex justify-center space-x-4 mb-6">
                    <button className="font-semibold hover:text-blue-600 border-b-4 border-transparent hover:border-blue-600">
                        Overview
                    </button>
                    <button className="font-semibold hover:text-blue-600 border-b-4 border-transparent hover:border-blue-600">
                        Documents
                    </button>
                    <button className="font-semibold hover:text-blue-600 border-b-4 border-transparent hover:border-blue-600">
                        Updates
                    </button>
                    <button className="font-semibold hover:text-blue-600 border-b-4 border-transparent hover:border-blue-600">
                        Tools
                    </button>
                </div>

                {/* Officers Section */}
                <div className="mb-6 bg-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-4">OFFICERS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Chair</span>
                            <p className="font-bold">Martha Goodall</p>
                        </div>
                        <div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Co-Chair</span>
                            <p className="font-bold">Peggy Smith</p>
                        </div>
                        <div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Secretary/Treasurer</span>
                            <p className="font-bold">Eric Holden</p>
                            <a href="mailto:example@email.com" className="text-blue-600 hover:underline">Email</a>
                        </div>
                        <div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Grievance Officer</span>
                            <p className="font-bold">Tristan Twohig, RN</p>
                            <p className="text-sm text-gray-600">(when contacting, text to cell phone number is preferred)</p>
                            <p className="font-semibold">503-701-1284</p>
                            <a href="mailto:example@email.com" className="text-blue-600 hover:underline">Email</a>
                        </div>
                        <div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Membership Officer</span>
                            <p className="font-bold">Emily Troyer</p>
                            <a href="mailto:example@email.com" className="text-blue-600 hover:underline">Email</a>
                        </div>
                        <div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded">Membership-at-Large</span>
                            <p className="font-bold">Teresa Wood</p>
                        </div>
                    </div>
                </div>

                {/* WSNA Staff Contact */}
                <div className="mb-6 bg-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-2">WSNA STAFF CONTACT</h2>
                    <p className="font-bold">Allesondra Machorro, BSN, RN, CCRN</p>
                    <p>Nurse Representative</p>
                </div>

                {/* Social Media */}
                <div className="mb-6 bg-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-2">SOCIAL MEDIA</h2>
                    <a href="https://facebook.com" className="flex items-center text-blue-600 hover:underline">
                        <i className="fab fa-facebook mr-2"></i> Facebook
                    </a>
                </div>

                {/* Contract Section */}
                <div className="mb-6 bg-gray-100 p-6">
                    <h2 className="text-xl font-semibold mb-2">CONTRACT</h2>
                    <a href="#" className="flex items-center text-blue-600 hover:underline">
                        <i className="fas fa-file-pdf mr-2"></i> Holy Family CBA 2023 2027
                    </a>
                </div>
            </div>
        </div>
    );
}
