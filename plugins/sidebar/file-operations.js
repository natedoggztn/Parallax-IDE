'use strict';

const React = require('react');
const { Menu, MainButton, ChildButton } = require('react-mfb-iceddev');

require('react-mfb-iceddev/mfb.css');

const NewFileOverlay = require('./overlays/new-file');
const DownloadOverlay = require('./overlays/download');
const DeleteConfirmOverlay = require('./overlays/delete-confirm');
const { reloadDevices } = require('../../src/actions/device.js');
const { clearName } = require('../../src/actions/file');

const styles = require('./styles');

const FileOperations = React.createClass({
  handleError: function(err){
    // leaving this in for better debugging of errors
    console.log(err);
    const toast = this.props.toast;

    toast.show(err.message, { style: styles.errorToast });
  },
  handleSuccess: function(msg){
    const toast = this.props.toast;

    toast.show(msg, { style: styles.successToast, timeout: 5000 });
  },
  saveFile: function(evt){
    if(evt){
      evt.preventDefault();
    }

    const space = this.props.workspace;

    const name = space.filename.deref();

    // TODO: these should transparently accept cursors for all non-function params
    space.saveFile(name, space.current)
      .tap(() => this.handleSuccess(`'${name}' saved successfully`))
      .catch(this.handleError);
  },
  createFile: function(name){
    const { workspace, overlay, loadFile } = this.props;

    if(!name){
      return;
    }

    workspace.filename.update(() => name);
    workspace.current.update(() => '');
    // TODO: these should transparently accept cursors for all non-function params
    workspace.saveFile(workspace.filename.deref(), workspace.current)
      .tap(() => loadFile(name, () => this.handleSuccess(`'${name}' created successfully`)))
      .catch(this.handleError)
      .finally(overlay.hide);
  },
  deleteFile: function(name){
    const space = this.props.workspace;
    const overlay = this.props.overlay;

    if(!name){
      return;
    }

    space.deleteFile(space.filename)
      .tap(() => this.handleSuccess(`'${name}' deleted successfully`))
      .catch(this.handleError)
      .finally(overlay.hide);
  },
  escapeDialog: function() {
    this.hideOverlay();
    clearName();
  },
  renderOverlay: function(component){
    const overlay = this.props.overlay;

    function renderer(el){
      React.render(component, el);
    }

    overlay.render(renderer, { backdrop: true });
  },
  hideOverlay: function(){
    const overlay = this.props.overlay;
    overlay.hide();
  },
  newFile: function() {
    const { workspace } = this.props;
    workspace.current.update(() => '');

    const directory = workspace.directory.deref();
    const untitledFiles = directory.filter(x => {
      return x.get('name').match(/untitled/);
    });

    console.log(untitledFiles);
    untitledFiles.takeLast(x => {
      console.log(x.get('name').match(/\d+/g));
    });

    const numUntitled = 2;

    workspace.filename.update(() => `untitled${numUntitled}`);
  },
  showCreateOverlay: function(evt){
    evt.preventDefault();

    const component = (
      <NewFileOverlay
        onAccept={this.createFile}
        onCancel={this.hideOverlay} />
    );

    this.renderOverlay(component);
  },
  showDeleteOverlay: function(evt){
    evt.preventDefault();

    const space = this.props.workspace;

    const name = space.filename.deref();

    if(!name){
      return;
    }

    const component = (
      <DeleteConfirmOverlay
        name={name}
        onAccept={this.deleteFile}
        onCancel={this.hideOverlay} />
    );

    this.renderOverlay(component);
  },
  showDownloadOverlay: function(evt){
    evt.preventDefault();

    reloadDevices();

    const component = (
      <DownloadOverlay
        onCancel={this.hideOverlay}
        irken={this.props.irken}
        handleSuccess={this.handleSuccess}
        handleError={this.handleError} />
    );

    this.renderOverlay(component);
  },
  componentDidMount: function(){
    this.keySaveFile = app.keypress(app.keypress.CTRL_S, this.saveFile);
    this.keyCloseDialog = app.keypress(app.keypress.ESC, this.escapeDialog);
  },
  componentWillUnmount: function(){
    if(this.keySaveFile) {
     this.keySaveFile();
    }
    if(this.keyCloseDialog) {
     this.keyCloseDialog();
    }
  },
  render: function(){
    return (
      <Menu effect="zoomin" method="click" position="bl">
        <MainButton
          iconResting="ion-plus-round"
          iconActive="ion-close-round" />
        <ChildButton
          onClick={this.showDownloadOverlay}
          icon="ion-code-download"
          label="Download" />
        <ChildButton
          onClick={this.showDeleteOverlay}
          icon="ion-backspace-outline"
          label="Delete File" />
        <ChildButton
          onClick={this.saveFile}
          icon="ion-compose"
          label="Save File" />
        <ChildButton
          onClick={this.newFile}
          icon="ion-document"
          label="New File" />
      </Menu>
    );
  }
});

module.exports = FileOperations;
