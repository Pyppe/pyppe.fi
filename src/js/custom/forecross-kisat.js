$(() => {

  function videoTime(video) {
    return `Kello ${video.date.substring(10, 16)}`;
  }
  const FILE_DIR = '/resources/forecross-kisat'

  $.get(`${FILE_DIR}/videos.json`, {h: pyppe.resourceHash}).then(videos => {
    
    const $container = $('#forecross-kisat');

    const $modal = $(`
      <div class="modal fade bd-example-modal-lg" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"></h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body"></div>
          </div>
        </div>
      </div>
    `).appendTo($container);
    $modal.on('hide.bs.modal', () => {
      $modal.find('video').trigger('pause');
    });

    const $media = $(`
      <div class="container">
        <div class="row"/>
      </div>
    `).appendTo($container).find('.row');
    _.forEach(videos, v => {
      $(`
        <div class="col-lg-6">
          <div class="media" style="margin-bottom: 20px;">
            <div class="play-video">
              <i
                class="fa fa-play"
                style="position: absolute; top: 45px; left: 70px; font-size: 40px; pointer-events: none;"
              ></i>
              <img
                class="img-thumbnail mr-3"
                src="${FILE_DIR}/${v.fileName}.jpg"
                style="height: 130px; border-radius: 50%; padding: 1px; cursor: pointer"
              />
            </div>
            <div class="media-body align-self-center">
              <h5 class="mt-0">
                ${videoTime(v)}
                <a href="${v.videoPage}" target="_blank"><i class="fa fa-facebook-square"></i></a>
              </h5>
              <p>${_.escape(v.text) || '&nbsp;'}</p>
            </div>
          </div>
        </div>
      `).appendTo($media).find('img').data('video', v);
    });

    $media.find('img').click(function() {
      showVideoModal($(this).data('video'));
    });

    $modal.on('click', 'button[data-video-index]', function() {
      showVideoModal(
        videos[parseInt($(this).data('videoIndex'), 10)]
      );
    });

    function findPreviousAndNext(video) {
      const idx = _.findIndex(videos, v => v.fileName === video.fileName);
      return {
        previous: idx > 0 ? idx-1 : undefined,
        next : idx === _.size(videos)-1 ? undefined : idx+1,
      };
    }

    function showVideoModal(video) {
      const height = Math.max($(window).height() - 150, 400);
      const {previous, next} = findPreviousAndNext(video);
      const buttonHtml = (isBackward, videoIndex) => {
        return (`
          <button
            type="button"
            class="btn btn-primary"
            style="position: absolute; ${isBackward ? 'left: 0' : 'right: 0'}; z-index: 2;"
            data-video-index="${videoIndex}"
          >
            ${isBackward ?
              '<i class="fa fa-backward"></i> Edellinen'
              :
              'Seuraava <i class="fa fa-forward"></i>'
            }
          </button>
        `);
      };
      $modal.find('.modal-title').html(`
        ${videoTime(video)} <small class="text-muted">${_.escape(video.text)}</small>
      `);

      $modal.find('.modal-body').html(
        $(`
          <div style="position: relative">
            ${_.isFinite(previous) ? buttonHtml(true, previous) : ''}
            ${_.isFinite(next) ? buttonHtml(false, next) : ''}
            <video controls autoplay style="width: 100%; height: ${height}px;">
              <source src="${FILE_DIR}/${video.fileName}.mp4" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
        `)
      );
      $modal.modal('show');
    }

  });

});