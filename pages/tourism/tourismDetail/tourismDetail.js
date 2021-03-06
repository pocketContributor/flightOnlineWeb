const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        role: "",
        openid: '',
        isTourismLoaded: false,
        isRepliesLoaded: false,
        tourism: {},
        replies: [],
        pageNumber: 0,
        userInfo: '',
        isSignUp: false,
        sort: {
            postDate: 'ASC'
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var tourism_id = "tourism.id";
        this.setData({
            [tourism_id]: options.tourismId,
            role: app.globalData.role,
            openid: app.globalData.openid,
            userInfo: app.globalData.userInfo
        })
    },

    onSignUpClick: function (e) {
        if (!app.globalData.authorized) {
            wx.showModal({
                title: '用户未授权',
                content: '如需正常使用该小程序的全部功能，请允许我们获取您的已公开的微信用户信息（如微信昵称，头像等）。请在个人中心页面中点击授权。谢谢配合！',
                showCancel: false,
                success: function (res) {
                    if (res.confirm) {
                        console.log('用户点击确定')
                        wx.switchTab({
                            url: '/pages/user/index/index',
                        })
                    }
                }
            })
        } else {
            wx.navigateTo({
                url: '../signUp/signUp?tourismId=' + e.currentTarget.dataset.tourismid + '&tourismPoster=' + this.data.tourism.poster
            })
        }
    },

    onDeleteAction: function (e) {
        console.log("to be deleted, id:" + e.target.dataset.id);
        var _this = this;
        wx.showModal({
            content: '确认删除此内容吗？',
            //content: '弹窗内容，告知当前状态、信息和解决方法，描述文字尽量控制在三行内',
            confirmText: "确认",
            cancelText: "取消",
            success: function (res) {
                console.log(res);
                if (res.confirm) {
                    console.log('删除')
                    _this.deleteAction(e.target.dataset.id, e.target.dataset.subject, e.target.dataset.msgtype)
                } else {
                    console.log('取消')
                }
            }
        });
    },

    deleteAction: function (id, subject, msgtype) {
        var _this = this;
        var url = "";
        if (subject == 'TOURISM' && msgtype == 'TOPIC') {
            url = app.globalData.serverHost + '/tourism/tourism/' + id;
        } else if (msgtype == "REPLY") {
            url = app.globalData.serverHost + '/message/reply/' + id;
        }
        wx.request({
            url: url,
            method: 'DELETE',
            success: function (res) {
                if (res.data.status == "success") {
                    wx.showToast({
                        title: '删除成功',
                        icon: 'success',
                        duration: 1500,
                        success: function () {
                            if (msgtype == 'TOPIC') {
                                app.globalData.toBeRemovedTopicId = id;
                                wx.navigateBack({});
                            } else {
                                _this.loadReplies()
                            }
                        }
                    });
                }
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.setData({
            pageNumber: 0,
            replies: []
        })
        this.loadData();
        this.loadReplies();
    },

    loadData: function() {
        var _this = this;
        wx.showNavigationBarLoading()
        wx.request({
            url: app.globalData.serverHost + '/tourism/tourism?tourismId=' + this.data.tourism.id,
            method: 'GET',
            success: function (res) {
                if (res.data.status == "success") {
                    _this.setData({
                        isTourismLoaded: true
                    })
                    wx.hideNavigationBarLoading()
                    var tourism = res.data.data
                    var signUpSet = tourism.signUpSet;
                    if (signUpSet && signUpSet.length > 0) {
                        for (var i in signUpSet) {
                            if (signUpSet[i].openid == app.globalData.openid) {
                                _this.setData({
                                    isSignUp: true
                                })
                                break;
                            }
                        }
                    }
                    if (tourism.postDate) {
                        tourism.formatedPostDate = app.formatDate(tourism.postDate);
                        // tourism.postDate = tourism.postDate.split(' ')[0] + ' ' + tourism.postDate.split(' ')[1]
                        // if (tourism.postDate.split('-')[0] == (new Date().getYear()+1900)) {
                        //     tourism.postDate = tourism.postDate.substr(5)
                        // }
                        _this.setData({
                            tourism: res.data.data
                        })
                    }
                }
            }
        })
    },

    loadReplies: function(loadMore) {
        var _this = this;
        wx.showNavigationBarLoading();
        this.setData({
            pageNumber: loadMore == true ? this.data.pageNumber + 1 : 0
        })
        wx.request({
            url: app.globalData.serverHost + '/message/replies?beRepliedTopicId=' + this.data.tourism.id + "&pageNumber=" + this.data.pageNumber + "&subject=TOURISM" + '&sort=' + encodeURIComponent(JSON.stringify(this.data.sort)),
            method: 'GET',
            success: function (res) {
                if (res.data.status == "success") {
                    
                    
                    var replies = res.data.data;
                    var repliesArr = loadMore ? _this.data.replies : [];
                    for (var i in replies) {
                        var reply = replies[i];
                        if (reply.replyMessage.postDate) {
                            //reply.replyMessage.postDate = app.formatDate(reply.replyMessage.postDate);
                            reply.replyMessage.formatedPostDate = app.formatDate(reply.replyMessage.postDate);
                            reply.replyMessage.beRepliedPostDate = app.formatDate(reply.replyMessage.beRepliedPostDate); 
                            reply.replyMessage.commentStyle = (app.globalData.role != 'ADMIN' && app.globalData.openid != reply.replyMessage.poster) ? "padding-right: 0" : null
                        }
                        if (reply.replyMessage.isDeleted == false) {
                            repliesArr.push(reply)
                        }
                    }
                    _this.setData({
                        replies: repliesArr,
                        isRepliesLoaded: true
                    });
                    wx.hideNavigationBarLoading();
                }
            }
        })
    },

    onCommentAction: function(e) {
        if (!app.globalData.authorized) {
            wx.showModal({
                title: '用户未授权',
                content: '如需正常使用该小程序的全部功能，请允许我们获取您的已公开的微信用户信息（如微信昵称，头像等）。请在个人中心页面中点击授权。谢谢配合！',
                showCancel: false,
                success: function (res) {
                    if (res.confirm) {
                        console.log('用户点击确定')
                        wx.switchTab({
                            url: '/pages/user/index/index',
                        })
                    }
                }
            })
            return;
        }
        if (e.target.dataset.subject == "TOURISM" && e.target.dataset.msgtype == "TOPIC") {
            app.globalData.beRepliedContent = this.data.tourism.content;
            wx.navigateTo({
                url: "../../comment/comment?&beRepliedPostDate=" + this.data.tourism.postDate + "&beRepliedTopicId=" + this.data.tourism.id + "&beRepliedTopicTitle=" + this.data.tourism.title 
                + "&type=REPLY&subject=TOURISM"
            })
        } else if (e.target.dataset.subject == "TOURISM" && e.target.dataset.msgtype == "REPLY") {
            app.globalData.beRepliedContent = e.target.dataset.content;
            wx.navigateTo({
                url: "../../comment/comment?beRepliedPostDate=" + e.target.dataset.postdate + "&beRepliedTopicId=" + this.data.tourism.id
                + "&type=REPLY&subject=TOURISM" + "&beRepliedMessageId=" + e.target.dataset.id
                + "&beRepliedPoster=" + e.target.dataset.berepliedposter + "&beRepliedPosterNickName=" + e.target.dataset.posternickname + "&beRepliedTopicTitle=" + this.data.tourism.title 
            })
        }
        
    },

    loadMore: function() {
        console.log("end");
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        this.loadReplies(true)
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})