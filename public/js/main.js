ClassicEditor
    .create( document.querySelector( '#ta' ) )
    .catch( error => {
        console.error( error );
} );

$(function() {
    $('button.confirmDeletion').on('click', function() {
        if (!confirm('Are you sure to delete?')) return false;
    });

    if ($("[data-fancybox]").length) {
        $("[data-fancybox]").fancybox();
    }
});