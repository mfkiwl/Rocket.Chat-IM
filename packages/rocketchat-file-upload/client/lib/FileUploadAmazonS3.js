/* globals FileUpload, FileUploadBase, Slingshot */

FileUpload.AmazonS3 = class FileUploadAmazonS3 extends FileUploadBase {
	constructor(directive, meta, file) {
		super(meta, file);
		this.directive = directive;
		const directives = {
			'upload': 'rocketchat-uploads',
			'avatar': 'rocketchat-avatars'
		};
		this.uploader = new Slingshot.Upload(directives[directive], meta);
	}

	start(callback) {
		this.uploader.send(this.file, (error, downloadUrl) => {
			if (this.computation) {
				this.computation.stop();
			}

			if (error) {
				return callback.call(this, error);
			} else {
				const file = _.pick(this.meta, 'type', 'size', 'name', 'identify', 'description');
				file._id = downloadUrl.substr(downloadUrl.lastIndexOf('/') + 1);
				file.url = downloadUrl;

				if (this.directive === 'avatar') {
					return callback(null, file);
				}

				Meteor.call('sendFileMessage', this.meta.rid, 's3', file, () => {
					Meteor.setTimeout(() => {
						callback.call(this, null, file);
					}, 2000);
				});
			}
		});

		this.computation = Tracker.autorun(() => {
			this.onProgress(this.uploader.progress());
		});
	}

	onProgress() {}

	stop() {
		if (this.uploader && this.uploader.xhr) {
			this.uploader.xhr.abort();
		}
	}
};
