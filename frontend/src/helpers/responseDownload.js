/* eslint-disable no-param-reassign */
export default async (response, filename, mime, bom) => {
  const contentDisposition = response.headers?.get('content-disposition') || response.headers['content-disposition'];
  const contentType = response.headers?.get('content-type') || response.headers['content-type'];
  const blob = await response.blob();

  // set type of file and filename from "content-disposition" header
  if (!filename && (contentDisposition || contentType)) {
    const filenameMatch = contentDisposition
      ? contentDisposition.match(/filename="(.+)"/)
      : contentType.match(/name="(.+)"/) || '';

    if (filenameMatch.length === 2) [, filename] = filenameMatch;
  }

  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    // IE workaround for "HTML7007: One or more blob URLs were
    // revoked by closing the blob for which they were created.
    // These URLs will no longer resolve as the data backing
    // the URL has been freed."
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const blobURL = window.URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.style.display = 'none';
    tempLink.href = blobURL;
    tempLink.setAttribute('hidden', 'hidden');
    tempLink.setAttribute('download', filename);

    // Safari thinks _blank anchor are pop ups. We only want to set _blank
    // target if the browser does not support the HTML5 download attribute.
    // This allows you to download files in desktop safari if pop up blocking
    // is enabled.
    if (typeof tempLink.download === 'undefined') {
      tempLink.setAttribute('target', '_blank');
    }
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    window.URL.revokeObjectURL(blobURL);
  }
};
