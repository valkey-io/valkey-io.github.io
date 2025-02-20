---
template: fullwidth.html
title: Branding Guidelines
---

The following guidelines are made available for anyone who wants to use the Valkey logo and/or brand assets. 

It is important that these guidelines are followed so that people can easily identify all references to Valkey, and to ensure consistency.

## Logo Overview
<section class="branding-split-container">
{% logo_split_section(title="Primary Logo", image_url="/img/valkey-horizontal-color.svg", image_width="380px", image_alt="Valkey Horizontal Logo") %}
    This is our primary logo and should be used wherever possible.
{% end %}

{% logo_split_section(title="Stacked Logo", image_url="/img/valkey-stacked-color.svg", image_width="250px", image_alt="Valkey Stacked Logo") %}
    In the instance where the primary logo can not be used, the stacked variation is acceptable.
{% end %}
</section>

<section class="branding-single-container">
{% logo_single_section(
    title="Color Variations", 
    image_width="320px", 
    image1_url="/img/valkey-horizontal-black.svg", 
    image1_alt="Valkey Horizontal Black Logo",
    image2_url="/img/valkey-horizontal-color-light.svg", 
    image2_alt="Valkey Horizontal Light Logo"
    ) %}
    In the instance where the full color logo can not be used, there are two variations available.
{% end %}
</section>

<section class="branding-split-container">
{% logo_split_section(title="Spacing", image_url="/img/valkey-spacing-example.png", image_width="320px", image_alt="Valkey Logo Spacing Example") %}
Always preserve clear space around the Valkey logo. It is required to provide clarity and breathing room.
{% end %}

{% logo_split_section(title="Color", image_url="/img/valkey-horizontal-incorrect.svg", image_width="320px", image_alt="Valkey Logo Incorrect Color Example") %}
Changing the logo color is strictly not permitted. The Valkey logo should be used in its full color option or all-black or all-white when required.
{% end %}
</section>

<section class="branding-split-container">
{% logo_split_section(title="Elements", image_url="/img/valkey-horizontal-modified.svg", image_width="320px", image_alt="Valkey Logo Element Modification") %}
    Changing the Valkey logo elements is strictly not permitted.
{% end %}

{% logo_split_section(title="Scaling", image_url="/img/valkey-horizontal-squashed.svg", image_width="320px", image_alt="Valkey Logo Scaling Modification") %}
    Scaling or stretching the Valkey logo away from its normal proportions is strictly not permitted.
{% end %}
</section>

## Color Palette

<section class="palette-single-container">
<h3>Primary Color Palette</h3>
<div>
{{ palette_entry(palette_hex="#6983FF", palette_rgb="110 129 246", palette_cmyk="63 51 0 0", palette_pantone="Pantone 2718 C") }}

{{ palette_entry(palette_text_hex="#E7E4F4", palette_hex="#1A2026", palette_rgb="27 32 37", palette_cmyk="79 68 60 71", palette_pantone="Pantone Black C") }}
</div>
</section>

<section class="palette-single-container">
<h3>Secondary Color Palette</h3>
<div>
{{ palette_entry(palette_text_hex="#E7E4F4", palette_hex="#642637", palette_rgb="100 38 55", palette_cmyk="39 92 60 42", palette_pantone="Pantone 7421 C") }}

{{ palette_entry(palette_text_hex="#E7E4F4", palette_hex="#30176E", palette_rgb="48 23 110", palette_cmyk="95 100 20 14", palette_pantone="Pantone 2685 C") }}

{{ palette_entry(palette_text_hex="#1A2026", palette_hex="#E0A2AF", palette_rgb="224 162 175", palette_cmyk="4 45 15 0", palette_pantone="Pantone 494 C") }}

{{ palette_entry(palette_text_hex="#30176E", palette_hex="#BCB5E7", palette_rgb="188 181 231", palette_cmyk="24 27 0 0", palette_pantone="Pantone 2705 C") }}
</div>
</section>

There is also a downloadable [PDF version of these guidelines](https://github.com/valkey-io/assets/blob/main/Valkey%20Branding/valkey_brand_guidelines.pdf).

Further information regarding appropriate usage of the Valkey brand can be found in the [LF Projects Trademark Policy](https://lfprojects.org/policies/trademark-policy/).
