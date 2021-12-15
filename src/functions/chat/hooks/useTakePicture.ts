import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface Photo {
  filepath: string;
  webviewPath?: string;
}

export function useTakePicture() {
  const takePhoto = async () => {
    const cameraPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      allowEditing: false,
      quality: 100,
    });
    const fileName = new Date().getTime() + '.jpeg';
    const newPhoto = {
      filepath: fileName,
      base64: cameraPhoto.base64String,
    };
    return newPhoto;
  };

  return {
    takePhoto,
  };
}
