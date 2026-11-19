+++
title = "Finding where a video clip came from with Valkey Search"
date = 2026-11-19
description = """Shrink every frame of your footage to 576 numbers, index them with Valkey Search, and a compressed excerpt finds its source clip and start time.
Here is the code, the edits it survives, and the ones that fool it."""
authors = ["marksantos"]

[taxonomies]
blog_type = ["How-to"]

[extra]
featured = false
featured_image = "/assets/media/featured/random-04.webp"
+++

I run a video editing studio, and a lot of the work is finding things in footage.
Say a client sends back an eight-second excerpt that a chat app has re-encoded, with the note "use a different take of this shot".
Before anyone can do that, someone has to work out which source clip the excerpt came from and where in that clip it starts.

This post does that lookup with Valkey Search.
Each frame becomes a short vector, Valkey Search finds the nearest stored frame for every frame of the excerpt, and a vote over those matches gives the source clip and the start time.
Everything below ran on the `valkey/valkey-bundle:9.1.4` image, which ships Valkey 9.1.3 and valkey-search 1.2.1, with default settings.
Valkey 9.2.0 came out while I was writing this, but the bundle image for it was still a release candidate, so the numbers here are from 9.1.3.
The client side is Python with valkey-py 6.2.0, NumPy and FFmpeg 9.0.2.
Every snippet below assumes these imports and a connection to the container:

```python
import subprocess
from collections import Counter

import numpy as np
import valkey

r = valkey.Valkey(host="localhost", port=6379)
```

## A fingerprint for each frame

The fingerprint is deliberately crude: shrink the frame to 32 by 18 gray pixels and keep all 576 values.
That is enough to tell shots apart, and it survives re-encoding and resizing, because both mostly change fine detail that the shrink throws away.

```python
def gray_frames(path, fps=5):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path,
         "-vf", f"fps={fps},scale=32:18:flags=area,format=gray",
         "-f", "rawvideo", "-"],
        check=True, capture_output=True).stdout
    v = np.frombuffer(raw, np.uint8).reshape(-1, 18, 32)
    return v.astype(np.float32)


def fingerprint(frames, top=False):
    v = frames[:, :12] if top else frames
    v = v.reshape(len(v), -1)
    v = v - v.mean(axis=1, keepdims=True)
    norm = np.linalg.norm(v, axis=1, keepdims=True)
    return v / np.maximum(norm, 1e-6)
```

Subtracting each frame's mean and scaling it to unit length takes brightness and contrast out of the comparison.
A frame and a brighter grade of the same frame end up as nearly the same vector, and cosine distance between them measures only the pattern.
The `top` variant keeps the upper 12 of the 18 rows; the results section shows why.

This is not a semantic embedding.
It finds the same shot, not a shot that looks alike, which is what this job needs.

## Storing frames in Valkey

Each sampled frame is a hash holding the two vectors as raw float32 bytes, the clip name and the time in seconds.
One index covers all of them:

```python
r.execute_command(
    "FT.CREATE", "frames", "ON", "HASH", "PREFIX", "1", "frame:",
    "SCHEMA",
    "vec", "VECTOR", "HNSW", "6",
    "TYPE", "FLOAT32", "DIM", 576, "DISTANCE_METRIC", "COSINE",
    "top", "VECTOR", "HNSW", "6",
    "TYPE", "FLOAT32", "DIM", 384, "DISTANCE_METRIC", "COSINE",
    "clip", "TAG",
    "t", "NUMERIC")



def add_clip(r, clip, path):
    frames = gray_frames(path)
    vecs = fingerprint(frames)
    tops = fingerprint(frames, top=True)
    pipe = r.pipeline(transaction=False)
    for i, (v, tv) in enumerate(zip(vecs, tops)):
        pipe.hset(f"frame:{clip}:{i}", mapping={
            "vec": v.tobytes(), "top": tv.tobytes(),
            "clip": clip, "t": i / 5})
    pipe.execute()
```

Hierarchical Navigable Small World (HNSW) is the approximate nearest-neighbor graph that valkey-search builds for each vector field, and the `6` counts the attribute arguments after it.
The frames are written with plain `HSET`, and the index picks each key up as it lands, so there is no separate load step.

My test library is ten generated 60-second clips sampled at 5 frames per second, 3,000 frames in all.
The clips are Mandelbrot zooms, Game of Life runs, cellular automata, drifting gradients and a Sierpinski pattern, rendered with [FFmpeg's built-in video sources](https://ffmpeg.org/ffmpeg-filters.html#Video-Sources); the exact recipe is at the end of the post.
Fingerprinting and indexing all 3,000 frames took about 3 seconds on a laptop, and on a fresh container `used_memory` grew by 38 to 39 MiB.

## Querying the nearest frames

A k-nearest neighbors (KNN) query passes the fingerprint as a parameter:

```python
def nearest(r, vec, k=3, field="vec", clip=None):
    scope = "@clip:{" + clip + "}" if clip else "*"
    query = f"{scope}=>[KNN {k} @{field} $q AS dist]"
    reply = r.execute_command(
        "FT.SEARCH", "frames", query,
        "PARAMS", "2", "q", vec.tobytes(),
        "RETURN", "3", "clip", "t", "dist", "DIALECT", "2")
    hits = []
    for fields in reply[2::2]:
        f = dict(zip(fields[::2], fields[1::2]))
        name = f[b"clip"].decode()
        hits.append((name, float(f[b"t"]), float(f[b"dist"])))
    return sorted(hits, key=lambda h: h[2])
```

`dist` is the cosine distance, 1 minus the cosine similarity.
I computed one pair by hand in NumPy and it agreed with `FT.SEARCH` to five decimal places.
The part before `=>` decides which frames compete: `*` searches the whole library, and `@clip:{clip09}` searches only frames tagged `clip09`.
Over the 3,000 frames, `INFO commandstats` reported 64 to 71 microseconds per `FT.SEARCH` call on the server side across three runs, and the median round trip from Python to the container was about 0.35 ms.

## From matching frames to a start time

A single frame can match the wrong moment.
In one of the slow gradient clips, the frame at 43.0 seconds had near-twins at 55.6 and 30.4 seconds, all within a cosine distance of 0.001 of the query.
So every frame of the excerpt votes instead: a query frame at time `q` that matches source time `t` votes for an excerpt that starts at `t - q`.

```python
def locate(r, path, top=False, max_dist=0.25):
    vecs = fingerprint(gray_frames(path), top)
    field = "top" if top else "vec"
    votes = Counter()
    for i, v in enumerate(vecs):
        clip, t, dist = nearest(r, v, k=1, field=field)[0]
        if dist <= max_dist:
            votes[clip, round(t - i / 5, 1)] += 1
    if not votes:
        return None
    (clip, start), n = votes.most_common(1)[0]
    return clip, start, n / len(vecs)
```

Frames with nothing closer than 0.25 don't vote, so an excerpt that isn't in the library returns nothing instead of a guess.

## The edits it survives, and the ones that fool it

I cut eight-second excerpts from known places in the library, changed each one the way footage gets changed in practice, compressed it hard (x264 at a constant rate factor, CRF, of 35) and asked `locate` where it came from.
The percentage is the share of the excerpt's 40 frames that voted for the answer.

| Excerpt | Full-frame vectors | Top 12 rows only |
| --- | --- | --- |
| Downscaled to 480x270 | right clip and start (73%) | right (73%) |
| Game of Life, downscaled | right (100%) | right (100%) |
| Brighter, more contrast and saturation | right (100%) | right (100%) |
| Converted to 30 fps | right (98%) | right (98%) |
| Dark lower-third bar, flat shot | no answer | right (70%) |
| Dark lower-third bar, busy shot | no answer | right (100%) |
| Cropped to 80%, slow gradient | wrong start (18%) | wrong start (18%) |
| Cropped to 80%, zooming shot | right clip, start 1.6 s late (100%) | same |
| Mirrored | no answer | no answer |
| Not in the library | no answer | no answer |

The grade changed nothing: those frames matched at a cosine distance under 0.001, because the mean subtraction and scaling had already removed it.

A lower third broke the full-frame vectors.
A dark bar across 16% of a flat frame carries most of that frame's variance, so the fingerprint described the bar more than the shot.
This is where the second vector field pays off: the same hashes, the same query against `@top` instead of `@vec`, and both excerpts were found.

Crops are the real weakness.
These fingerprints compare framing, so a crop of a zoom looks exactly like a later moment of the same zoom, and the vote was unanimous and 1.6 seconds wrong.
On the slow gradient, no start time drew more than 7 of the 40 frames with either vector field, and the winner was wrong both times, so treat a low vote share as a warning.
If your edits reframe shots, check the answer by eye before trusting it.

The 0.25 cutoff came from the same runs.
Frames of the downscaled, graded and Game of Life excerpts matched at 0.013 or less, while no frame of the mirrored or unseen excerpts came closer than 0.388.
Your footage will have its own spread, so measure it before you settle on a number.

## Try it on your own footage

The bundle image starts with one command, `docker run --rm -p 6379:6379 valkey/valkey-bundle:9.1.4`, and the functions above are the whole client.
With the index created and the test clips from the next section on disk, this indexes the library and looks up one excerpt:

```python
for n in range(1, 11):
    add_clip(r, f"clip{n:02}", f"library/clip{n:02}.mp4")

print(locate(r, "queries/graded.mp4"))
# ('clip08', 41.0, 1.0)
```

Index a folder of your own clips, cut a few excerpts with FFmpeg, and see which of your edits the fingerprint survives.
The [`FT.CREATE`](https://valkey.io/commands/ft.create/) and [`FT.SEARCH`](https://valkey.io/commands/ft.search/) pages cover the options I left at their defaults, such as `FLAT` indexes for exact search and the `M` and `EF_RUNTIME` settings that trade HNSW memory and speed for recall.

## Rebuilding the test footage

Every clip in the library is 60 seconds of one FFmpeg source at 640x360 and 25 fps, encoded with x264 at CRF 18:

```sh
ffmpeg -f lavfi -i "SOURCE" -t 60 -c:v libx264 -crf 18 \
  -pix_fmt yuv420p library/clipNN.mp4
```

`SOURCE` is `NAME=s=640x360:rate=25` followed by these options:

```text
clip01  mandelbrot
clip02  mandelbrot  start_x=-0.16:start_y=1.0405:start_scale=0.4
clip03  mandelbrot  start_x=0.2925:start_y=0.0149:inner=period
clip04  life        seed=1:ratio=0.2:mold=10
                    life_color=#e0c060:death_color=#203050
clip05  life        seed=7:ratio=0.5:rule=B36/S23
                    life_color=#ffffff
clip06  cellauto    rule=30:random_fill_ratio=0.5:seed=3:scroll=1
clip07  cellauto    rule=110:random_fill_ratio=0.3:seed=5
clip08  gradients   seed=11:speed=0.02:nb_colors=4
                    c0=0x1d3557:c1=0xe63946:c2=0xf1c453:c3=0x2a9d8f
clip09  gradients   seed=42:speed=0.03:nb_colors=6:type=radial
                    c0=0x264653:c1=0x2a9d8f:c2=0xe9c46a
                    c3=0xf4a261:c4=0xe76f51:c5=0x8ecae6
clip10  sierpinski  seed=9:jump=50:type=triangle
```

Options on a second line are joined to the first with a colon.
The gradient colors are set by hand because FFmpeg picks unset ones at random, ignoring `seed`, so without them the two gradient clips change on every run.

Each excerpt is eight seconds cut from a library clip, filtered and compressed at CRF 35:

```sh
ffmpeg -ss START -i library/clipNN.mp4 -t 8 -vf "FILTER" \
  -c:v libx264 -crf 35 -pix_fmt yuv420p queries/NAME.mp4
```

| Excerpt | Clip | Start | Filter |
| --- | --- | --- | --- |
| Downscaled | clip02 | 23.4 | `scale=480:270` |
| Game of Life, downscaled | clip04 | 18.8 | `scale=480:270` |
| Graded | clip08 | 41.0 | `eq=brightness=0.08:contrast=1.25:saturation=1.4` |
| 30 fps | clip10 | 5.0 | `fps=30` |
| Lower third, flat | clip09 | 30.2 | the lower-third box below |
| Lower third, busy | clip02 | 44.0 | the lower-third box below |
| Cropped, slow gradient | clip08 | 20.0 | `crop=iw*0.8:ih*0.8,scale=640:360` |
| Cropped, zooming | clip01 | 12.6 | `crop=iw*0.8:ih*0.8,scale=640:360` |
| Mirrored | clip03 | 50.0 | `hflip` |

The lower-third box is `drawbox=x=0:y=ih*0.72:w=iw:h=ih*0.16:color=black@0.7:t=fill`.
The excerpt that is not in the library is eight seconds of `mandelbrot=s=640x360:rate=25:start_x=-1.25066:start_y=0.02012`, encoded the same way.
