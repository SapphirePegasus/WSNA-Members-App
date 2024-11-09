import LeftNavBar from "../components/leftnavbar";

export default function LocalNews() {
    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold">My Local Unit News</h1>
                </div>

                {/* News Section */}
                <div className="text-left  bg-gray-100 p-6">
                    <h2 className="text-2xl font-semibold mb-4">
                        The nurses of Providence VNA Home Health Need YOU!
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">Posted on Jul 21, 2024</p>

                    <h3 className="text-xl font-semibold mb-4">
                        It’s Time to Get the Community Behind the Nurses
                    </h3>

                    <div className="text-center mb-4">
                        <img
                            src="/wsnalogo.png"
                            alt="Safety is a way of life, not just a job."
                            className="mx-auto h-64"
                        />
                    </div>

                    <p className="mb-4">
                        Sign and share the community petition here to show Providence our community demands they put nurse safety first.
                    </p>

                    <p className="mb-4">
                        Management has told the nurses of VNA when it comes to conditions within the home, that “Home Health environments aren’t always wonderful; it’s part of the job.”
                    </p>

                    <p className="mb-4">
                        Did you know firefighters and police officers have safety measures in place currently to protect them in the field should they encounter a situation where they don’t feel safe? So why doesn’t VNA Home Health offer similar options to their RNs?
                    </p>

                    <p className="mb-4">
                        After 6 days of negotiations, the nurses cries for safety while in the field seeing patients has fallen on deaf ears. At the outset, Management provided that patient safety was their top priority, but their stated disinfection of WSNA’s proposals to improve RN safety sends an entirely different message. Less than two years after the murder of Doug Brant VNA RN while on a home visit, Management’s memory and commitment to nurses’ safety seems to have faded. The negotiations were focused on policy changes to address aggressive workplace violence concerns. They continued to stress that nurses must be able to exercise their professional judgment as to whether a situation is unsafe. They also stressed the need for security escorts when requested and the availability of a security app, such as Bond or AlertGPS, on their work phones.
                    </p>

                    <p className="mb-4">
                        Even when a known issue, that is well documented in a chart of a potential threat to an RN’s safety, is raised to the attention of management BEFORE the home visit, the nurses are still being told to do the home visit despite the RN’s protest of not feeling safe.
                    </p>

                    <p className="mb-4">
                        Previously, nurses were allowed to have security escorts when they felt unsafe during a visit. Now, Management steadfastly rejects WSNA’s proposal for a security escort provided by Providence if the nurse has a concern about potential violence. Further, Management’s deniability on the importance of a potentially unsafe situation where a nurse can feel threatened was shocking. NOBODY RN could continue to expose nurses to potentially unsafe and violent environments. In one instance, management told nurses that if a patient had previously pulled a knife, or a gun, or talked about fentanyl in plain sight, it is not a direct threat of violence, so it’s deemed safe by Management for nurses to go. Even Providence Protective Equipment didn’t see the common-sense need to implement additional training.
                    </p>

                    <p className="mb-4">
                        WSNA has made proposals that would give the power to nurses to decide whether a home visit is safe and the option of management BEFORE the home visit. Management has denied these proposals and leaves the decision up to a manager, who is not at the home, to decide on the nurse’s safety.
                    </p>

                    <p className="mb-4">
                        Providence must do better for our nurses. Sign the community petition to support VNA RNs TODAY!
                    </p>

                    <div className="text-center">
                        <a
                            href="https://petition-link.com"
                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            Sign the petition now
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
