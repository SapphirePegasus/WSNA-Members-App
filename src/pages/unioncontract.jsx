import LeftNavBar from "../components/leftnavbar";

export default function UnionContract() {
    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold">The Union Contract</h1>
                </div>
                <div className="w-full h-[85vh] overflow-y-auto">
                    <iframe
                        src="https://pdfobject.com/pdf/sample.pdf"
                        width="100%"
                        height="100%"
                        className="border-0"
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
