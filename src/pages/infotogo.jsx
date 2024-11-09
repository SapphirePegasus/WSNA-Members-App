import { useState } from "react";
import LeftNavBar from "../components/leftnavbar";
import { FaFilePdf, FaTimes } from "react-icons/fa"; // Importing icons for PDF and close button

const pdfDocuments = [
    { name: "Document 1", link: "https://pdfobject.com/pdf/sample.pdf" },
    { name: "Document 2", link: "https://pdfobject.com/pdf/sample.pdf" },
    { name: "Document 3", link: "https://pdfobject.com/pdf/sample.pdf" },
    { name: "Document 4", link: "https://pdfobject.com/pdf/sample.pdf" },
    { name: "Document 5", link: "https://pdfobject.com/pdf/sample.pdf" },
];

export default function InfoToGo() {
    const [selectedPdf, setSelectedPdf] = useState(null); // State to track selected PDF

    // Function to handle PDF click
    const handlePdfClick = (pdf) => {
        setSelectedPdf(pdf);
    };

    // Function to close the PDF viewer
    const closePdfViewer = () => {
        setSelectedPdf(null);
    };

    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold">Info To Go</h1>
                </div>

                {/* If a PDF is selected, show the PDF viewer, else show the list */}
                {selectedPdf ? (
                    <div className="relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">{selectedPdf.name}</h2>
                            <button
                                className="text-red-500 hover:text-red-700"
                                onClick={closePdfViewer}
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        {/* PDF iframe viewer */}
                        <iframe
                            src={selectedPdf.link}
                            className="w-full h-[78vh] border"
                            title={selectedPdf.name}
                        />
                    </div>
                ) : (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Available Documents:</h2>
                        <ul className="space-y-4">
                            {pdfDocuments.map((doc, index) => (
                                <li
                                    key={index}
                                    className="flex items-center space-x-4 bg-gray-100 p-3 rounded-md hover:bg-gray-200 cursor-pointer"
                                    onClick={() => handlePdfClick(doc)}
                                >
                                    <FaFilePdf className="text-red-500" size={24} />
                                    <span className="text-lg">{doc.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
