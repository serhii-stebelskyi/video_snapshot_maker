const renderTimeSelectorBtn = (wrapperNode, callback) => {
  const button = document.createElement("button");
  button.textContent = "+ Add one more time selector";
  button.setAttribute("data-action", "add");
  button.addEventListener("click", function (event) {
    const action = event.target.getAttribute("data-action");
    switch (action) {
      case "add": {
        button.textContent = "- Stop adding a new time selector";
        button.setAttribute("data-action", "remove");
        callback(true);
        break;
      }
      case "remove": {
        button.textContent = "+ Add one more time selector";
        button.setAttribute("data-action", "add");
        callback(false);
        break;
      }
      default:
        console.error("incorrect btn action");
    }
  });
  wrapperNode.appendChild(button);
};
document.addEventListener("DOMContentLoaded", function () {
  const uploadVideoFieldNode = document.getElementById("upload_video_field");
  const leftSideNode = document.getElementById("left_side");
  const videoUploadBoxNode = document.getElementById("video_upload_box");

  let isTimeSelectorAdding = false;

  uploadVideoFieldNode.addEventListener("change", function () {
    const videoPlayerSectionNode = document.getElementById(
      "video_player_wrapper"
    );
    const videoPlayerNode = document.getElementById("video_player");
    const currentVideoTimelineNode = document.getElementById(
      "current_video_timeline"
    );
    const timeSelectorsSectionNode = document.getElementById(
      "time_selectors_section"
    );
    const timeSelectorsListNode = document.getElementById(
      "time_selectors_list"
    );
    const generateFramesBtnNode = document.getElementById(
      "generate_frames_btn"
    );

    const uploadedVideo = uploadVideoFieldNode.files[0];

    videoUploadBoxNode.classList.add("hidden");
    leftSideNode.classList.remove("empty");
    const uploadedVideoURL = URL.createObjectURL(uploadedVideo);
    videoPlayerNode.setAttribute("type", uploadedVideo.type);
    videoPlayerNode.setAttribute("src", uploadedVideoURL);
    videoPlayerNode.setAttribute("width", window.innerWidth / 2 - 40);

    videoPlayerSectionNode.classList.remove("hidden");

    let videoDuration = 0;
    videoPlayerNode.addEventListener("timeupdate", function () {
      const currentSeconds = this.currentTime;
      if (!videoDuration) videoDuration = videoPlayerNode.duration;
      const percentage = (currentSeconds * 100) / videoDuration;
      currentVideoTimelineNode.style.width = `${percentage}%`;
    });

    generateFramesBtnNode.addEventListener("click", function (event) {
      const rightSideNode = document.getElementById("right_side");
      const generatedPhotosListNode = document.getElementById(
        "generated_photos_list"
      );
      const loaderNode = document.getElementById("loader");

      rightSideNode.classList.remove("hidden");

      const timeCodes = [];
      for (const timeSelectorNode of timeSelectorsListNode.childNodes) {
        const timeSec = timeSelectorNode.dataset.time;
        const hours = Math.floor(timeSec / 3600);
        const minutes = Math.floor((timeSec % 3600) / 60);
        const seconds = (timeSec % 60).toFixed(3);

        const timeCode = `${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}:${String(seconds).padStart(6, "0")}`;
        timeCodes.push(timeCode);
      }
      const uniqueTimeCodes = [...new Set(timeCodes)];
      if (uniqueTimeCodes.length > 0) {
        loaderNode.classList.remove("hidden");
        const formData = new FormData();
        formData.append("video", uploadedVideo);
        formData.append("timeCodes", uniqueTimeCodes);

        fetch("http://localhost:8888/generate_frames", {
          method: "POST",
          body: formData,
        })
          .then((res) => res.json())
          .then((data) => {
            const framesHTML = data
              .map(
                (imageURL) => `<li
                style="
                  background-image: url(${imageURL});
                "
              >
                <a
                  class="view_link"
                  target="_blank"
                  href="${imageURL}"
                ></a>
                <span
                  class="download_btn"
                  data-link="${imageURL}"
                  data-action="download"
                >
                  <svg
                    width="800px"
                    height="800px"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    data-link="${imageURL}"
                    data-action="download"
                  >
                    <path
                      d="M8 22.0002H16C18.8284 22.0002 20.2426 22.0002 21.1213 21.1215C22 20.2429 22 18.8286 22 16.0002V15.0002C22 12.1718 22 10.7576 21.1213 9.8789C20.3529 9.11051 19.175 9.01406 17 9.00195M7 9.00195C4.82497 9.01406 3.64706 9.11051 2.87868 9.87889C2 10.7576 2 12.1718 2 15.0002L2 16.0002C2 18.8286 2 20.2429 2.87868 21.1215C3.17848 21.4213 3.54062 21.6188 4 21.749"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                    <path
                      d="M12 2L12 15M12 15L9 11.5M12 15L15 11.5"
                      stroke="#ffffff"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
              </li>`
              )
              .join("");
            generatedPhotosListNode.innerHTML = framesHTML;
            generateFramesBtnNode.disabled = true;
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            loaderNode.classList.add("hidden");
          });
      }

      generatedPhotosListNode.addEventListener("click", function (event) {
        const targetNodeDataSet = event.target.dataset;

        if (targetNodeDataSet.action === "download") {
          const imageURL = targetNodeDataSet.link;
          fetch(imageURL)
            .then((response) => response.blob())
            .then((blob) => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "frame.jpg";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            })
            .catch(console.error);
        }
      });
    });
    renderTimeSelectorBtn(timeSelectorsSectionNode, (isAdding) => {
      isTimeSelectorAdding = isAdding;
    });

    let ghostTimeSelectorNode = null;
    let isVideoPlayerPlayedBeforeTimeSelectorAdding = false;

    const createAndSetNewTimeSelector = (layerX) => {
      const newGhostTimeSelector = document.createElement("div");
      newGhostTimeSelector.setAttribute("data-is-ghost", "true");
      newGhostTimeSelector.style.left = `${layerX - 3.5}px`;
      const newGhostTimeSelectorChild = document.createElement("span");
      newGhostTimeSelector.appendChild(newGhostTimeSelectorChild);
      timeSelectorsListNode.appendChild(newGhostTimeSelector);
      ghostTimeSelectorNode = newGhostTimeSelector;
    };
    timeSelectorsListNode.addEventListener("mouseenter", function (event) {
      if (!isTimeSelectorAdding) return;
      createAndSetNewTimeSelector(event.layerX);
      currentVideoTimelineNode.classList.add("hidden");

      isVideoPlayerPlayedBeforeTimeSelectorAdding = !videoPlayerNode.paused;
      videoPlayerNode.pause();
    });
    timeSelectorsListNode.addEventListener("mouseleave", function () {
      if (!isTimeSelectorAdding) return;
      if (ghostTimeSelectorNode) {
        if (ghostTimeSelectorNode.hasAttribute("data-is-ghost")) {
          ghostTimeSelectorNode.remove();
        }
        ghostTimeSelectorNode = null;
        if (isVideoPlayerPlayedBeforeTimeSelectorAdding) {
          videoPlayerNode.play();
        }
        currentVideoTimelineNode.classList.remove("hidden");
      }
    });
    timeSelectorsListNode.addEventListener("mousemove", function (event) {
      if (!isTimeSelectorAdding) return;
      const xPos = event.layerX - 3.5;
      if (
        ghostTimeSelectorNode &&
        event.target === timeSelectorsListNode &&
        ghostTimeSelectorNode.hasAttribute("data-is-ghost")
      ) {
        ghostTimeSelectorNode.style.left = `${xPos}px`;

        const percentage =
          (event.layerX * 100) / timeSelectorsListNode.clientWidth;
        const newVideoTime = (videoPlayerNode.duration * percentage) / 100;

        if (videoPlayerNode.fastSeek) {
          videoPlayerNode.fastSeek(newVideoTime);
        } else {
          videoPlayerNode.currentTime = newVideoTime;
        }
      }
    });

    timeSelectorsListNode.addEventListener("click", function (event) {
      const targetNode = event.target;

      if (!isTimeSelectorAdding) {
        if (targetNode.tagName === "SPAN") {
          const parentNode = targetNode.parentNode;
          if (parentNode.dataset["is-ghost"] === "true") return;
          parentNode.remove();
          generateFramesBtnNode.disabled = false;
        } else if (targetNode.dataset.time) {
          if (targetNode.dataset["is-ghost"] === "true") return;
          targetNode.remove();
          generateFramesBtnNode.disabled = false;
        }
      } else {
        if (
          (targetNode.tagName === "SPAN" &&
            targetNode.parentNode.dataset.time) ||
          targetNode.dataset.time
        )
          return;

        ghostTimeSelectorNode.removeAttribute("data-is-ghost");
        generateFramesBtnNode.removeAttribute("disabled");

        const currentSelectorLeftPos =
          Number(ghostTimeSelectorNode.style.left.replace("px", "")) + 3.5;

        const percentage =
          (currentSelectorLeftPos > 0 ? currentSelectorLeftPos : 0 * 100) /
          timeSelectorsListNode.clientWidth;
        const currentSelectorSeconds = videoPlayerNode.duration * percentage;
        ghostTimeSelectorNode.setAttribute("data-time", currentSelectorSeconds);

        const rect = event.currentTarget.getBoundingClientRect();
        const layerX = event.clientX - rect.left;
        createAndSetNewTimeSelector(layerX);
      }
    });
  });
});
