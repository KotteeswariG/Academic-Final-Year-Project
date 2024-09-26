import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusText, setStatusText] = useState("");

  const isValidUrl = (url) => {
    const pattern =
      /^https?:\/\/(www\.)?([a-z]{2})\.wikipedia\.org\/wiki\/(.+)$/;
    const invalidCharsPattern = /[#<>[\]|{}]/;
    return pattern.test(url) && !invalidCharsPattern.test(url);
  };

  const handleURLSubmit = async (e) => {
    e.preventDefault();
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid Wikipedia URL");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/create_video_from_url/", { url });
      setVideoUrl(response.data.video_url); // Adjusted to use correct key
      toast.success("Video generated successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error generating video");
    } finally {
      setLoading(false);
    }
  };

  const checkVideoStatus = async () => {
    if (!videoUrl) {
      toast.error("No video URL available for checking status");
      return;
    }
    setCheckingStatus(true);
    try {
      const response = await axios.get(`/api/video-status/${videoUrl}`);
      setStatusText("Status: " + response.data.Status); // Updated status text logic
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error checking video status");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setVideoUrl("");
    setStatusText("");
    setLoading(false);
    setCheckingStatus(false);
  };

  return (
    <div className="min-h-screen bg-violet-600 text-gray-900">
      <ToastContainer />

      <div className="flex justify-center items-center h-screen">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">wiki2vid</h1>
          <p className="text-sm mb-6 text-center text-gray-600">
            Convert Wikipedia articles into videos effortlessly.
          </p>

          <form onSubmit={handleURLSubmit} className="mb-4">
            <div className="mb-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Wikipedia URL"
                className="w-full p-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Generate
              </button>
              <button
                onClick={handleReset}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Reset
              </button>
            </div>
          </form>

          {loading && <div className="text-center">Processing...</div>}
          {videoUrl && (
            <>
              <video
                src={videoUrl}
                controls
                className="max-w-full h-auto my-4"
              />
              <div className="text-center">
                <button
                  onClick={() => window.open(videoUrl)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Download/Save
                </button>
                <button
                  onClick={checkVideoStatus}
                  className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Check Status
                </button>
              </div>
              {checkingStatus && <p>Checking status...</p>}
              {statusText && <p>{statusText}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
