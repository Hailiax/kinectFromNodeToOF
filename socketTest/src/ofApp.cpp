#include "ofApp.h"

//--------------------------------------------------------------
void ofApp::setup(){
    isConnected = false;
    address = "http://192.168.1.20:3000";
    status = "not connected";
    
    socketIO.setup(address);
    
    ofAddListener(socketIO.notifyEvent, this, &ofApp::gotEvent);
    
    ofAddListener(socketIO.connectionEvent, this, &ofApp::onConnection);
}

void ofApp::onConnection () {
    isConnected = true;
    bindEvents();
}

void ofApp::bindEvents () {
    std::string serverEventName = "kinectData";
    socketIO.bindEvent(serverEvent, serverEventName);
    ofAddListener(serverEvent, this, &ofApp::onServerEvent);
}

//--------------------------------------------------------------
void ofApp::update(){
    
}

//--------------------------------------------------------------
void ofApp::draw(){
    ofDrawBitmapStringHighlight(ofApp::status, 20, 20);
}

//--------------------------------------------------------------
void ofApp::keyPressed(int key){
    
}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){
    
}

//--------------------------------------------------------------
void ofApp::gotEvent(string& name) {
    status = name;
}

//--------------------------------------------------------------
void ofApp::onServerEvent (ofxSocketIOData& data) {
    
    jointX = data.getIntValue("x");
    jointY = data.getIntValue("y");
    
    cout << "x: ";
    cout << jointX << endl;
    cout << "y: ";
    cout << jointY << endl;

}
