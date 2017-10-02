const bindClick = (cy) => {
    //Tippy JS Events
    //Binding actions (Try/Catch blocks re only for quick demo purposes)
    //Bind right click event to tippy.show()
    cy.on('cxttap', 'node', function (evt) {
        try {
            var popperElement = evt.target.scratch('tippy-popper');
            var isHidden = evt.target.scratch('showPopper');

            //Show only if popper is hidden 
            if (isHidden || isHidden === undefined) {
                evt.target.scratch('tippy').show(popperElement);
                evt.target.scratch('showPopper', false);
            }
            else {
                evt.target.scratch('tippy').hide(popperElement);
                evt.target.scratch('showPopper', true);
            }

            

        }
        catch (e) { }
    });

    //Bind drag  event to tippy.hide()
    cy.on('drag', 'node', function (evt) {
        try {
            var popperElement = evt.target.scratch('tippy-popper');
            evt.target.scratch('tippy').hide(popperElement);
            evt.target.scratch('showPopper', true);
        }
        catch (e) { }
    });

};

export default bindClick;