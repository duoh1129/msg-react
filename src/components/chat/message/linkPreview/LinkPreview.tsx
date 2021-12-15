import { responsiveFontSizes } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { HTTP } from '@ionic-native/http';
import 'src/assets/sass/messagenius/components/chat/message/LinkPreview.scss';

interface LProps {
  view: string;
  url?: string;
}

const LinkPreview: React.FC<LProps> = ({ view, url }) => {
  const [previewPicture, setPreviewPicture] = useState<string | undefined>(
    undefined
  );
  const [previewTitle, setPreviewTitle] = useState<string | undefined>(
    undefined
  );
  // get the title of the webpage
  useEffect(() => {
    const getWebsiteInfo = async () => {
      // get title
      await fetch(`http://textance.herokuapp.com/title/${url}`).then(
        async (res) => {
          let text = await res.text();
          setPreviewTitle(text);
        }
      );
      await HTTP.get(
        `https://find-icon.herokuapp.com/allicons.json?url=${url}`,
        {},
        {}
      ).then(async (res) => {
        let object = await JSON.parse(res.data);
        setPreviewPicture(object?.icons[0]?.url);
      });
    };

    getWebsiteInfo();
  }, [url]);

  const getWebsiteURL = () => {
    let urlHTTP;
    if (url?.toString()?.startsWith('http')) {
      urlHTTP = url;
    } else {
      urlHTTP = `http://${url}`;
    }
    let finalURL = encodeURI(urlHTTP || '');
    return finalURL;
  };

  return (
    <>
      {view == 'footer' &&
        previewTitle !== undefined &&
        previewPicture !== undefined && (
          <div className="linkpreview-container">
            <div className="preview-picture">
              <img src={previewPicture} alt="" />
            </div>
            <div className="preview-text">
              <div className="preview-title">
                <b>{previewTitle}</b>
              </div>
              <div className="preview-url">{url}</div>
            </div>
          </div>
        )}
      {view == 'message' &&
        previewTitle !== undefined &&
        previewPicture !== undefined && (
          <button
            style={{
              textAlign: 'start',
            }}
            onClick={() => window.open(getWebsiteURL(), '_blank')}
          >
            <div className="linkpreview-container-message">
              <div className="preview-picture-message">
                <img src={previewPicture} alt="" />
              </div>
              <div className="preview-text-message">
                <div className="preview-title-message">
                  <b>{previewTitle}</b>
                </div>
                <div className="preview-url-message">{url}</div>
              </div>
            </div>
          </button>
        )}
    </>
  );
};

export default LinkPreview;
