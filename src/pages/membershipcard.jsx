import LeftNavBar from "../components/leftnavbar";

export default function MembershipCard() {
    // Retrieve user data from local storage
    const userName = localStorage.getItem('userName');
    const wsnaid = localStorage.getItem('wsnaid');
    const aftid = localStorage.getItem('aftid');
    const anaid = localStorage.getItem('anaid');

    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold">Membership Card</h1>
                </div>
                <div className="flex items-center justify-center">
                    <div className="bg-gray-200 mt-10 shadow-2xl rounded-xl w-full md:w-96 lg:w-1/2 p-6 space-y-4">
                        <div className="flex justify-center mb-4">
                            <img
                                className="w-44"
                                src="/wsnalogo.png"
                                alt="Logo"
                            />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-semibold">{userName}</p>
                            <p className="text-sm">WSNA ID: {wsnaid}</p>
                            <p className="text-sm">AFT ID: {aftid}</p>
                            <p className="text-sm">ANA ID: {anaid}</p>
                        </div>
                        <div className="flex justify-between mt-6 space-x-4">
                            <div className="flex-1 text-center">
                                <img
                                    className="w-32 h-32 object-cover rounded-md mx-auto"
                                    src="/wsnalogo.png"
                                    alt="Image 1"
                                />
                            </div>
                            <div className="flex-1 text-center">
                                <img
                                    className="w-32 h-32 object-cover rounded-md mx-auto"
                                    src="/wsnalogo.png"
                                    alt="Image 2"
                                />
                            </div>
                            <div className="flex-1 text-center">
                                <img
                                    className="w-32 h-32 object-cover rounded-md mx-auto"
                                    src="/wsnalogo.png"
                                    alt="Image 3"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
