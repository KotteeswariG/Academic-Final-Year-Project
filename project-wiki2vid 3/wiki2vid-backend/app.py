from pydantic import BaseModel, HttpUrl
import wikipediaapi
import torch
from transformers import BartTokenizer, BartForConditionalGeneration
from gtts import gTTS
from moviepy.editor import TextClip, CompositeVideoClip, AudioFileClip
import os
from urllib.parse import unquote
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow all origins in development (update with specific origins in production)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)




# Static Files for videos
app.mount("/videos", StaticFiles(directory="videos"), name="videos")




@app.get("/download_video/{video_filename}")
async def download_video(video_filename: str):
    video_path = f"videos/{video_filename}"
    return FileResponse(video_path)


# Initialize BART model and Wikipedia API
tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn')
user_agent = "FastAPIWikipediaApp/1.0 (contact@easu.com)"
wiki_wiki = wikipediaapi.Wikipedia(language='en', user_agent=user_agent)


class WikipediaURLRequest(BaseModel):
    url: HttpUrl


@app.post("/create_video_from_url/")
async def create_video_from_url(request: WikipediaURLRequest):
    # Convert the HttpUrl object to a string and then perform operations
    url_str = str(request.url)
    title = unquote(url_str.split("/")[-1]).replace('_', ' ')

    # Fetch and summarize the Wikipedia article
    page = wiki_wiki.page(title)
    if not page.exists():
        raise HTTPException(status_code=404, detail="Article not found")

    inputs = tokenizer([page.text], max_length=1024,
                       return_tensors='pt', truncation=True)
    summary_ids = model.generate(
        inputs['input_ids'], num_beams=4, max_length=300, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    # Convert the summary to speech
    tts = gTTS(summary)
    audio_filename = "speech.mp3"
    tts.save(audio_filename)

    # Create the video
    audio_clip = AudioFileClip(audio_filename)
    text_clip = TextClip(summary, fontsize=24, color='white',
                         bg_color='black', size=(800, 600))
    text_clip = text_clip.set_duration(
        audio_clip.duration).set_audio(audio_clip)

    # Ensure the 'videos' directory exists
    os.makedirs("videos", exist_ok=True)

    # Save the video in the 'videos' folder
    video_filename = f"videos/{title.replace(' ', '_')}_video.mp4"
    video = CompositeVideoClip([text_clip])
    video.write_videofile(video_filename, fps=24)

    # Return the URL of the video
    video_url = f"/videos/{os.path.basename(video_filename)}"
    return {"video_url": video_url}

    # Return the video file as response
    return FileResponse(video_filename, media_type="video/mp4")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)