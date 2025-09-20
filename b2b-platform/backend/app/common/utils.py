from PIL import Image
from django.core.files.base import ContentFile
from io import BytesIO
import os
from django.core.exceptions import ValidationError


def resize_image(image_file, max_size=(300, 300), quality=90):
    """
    Функция для автоматического ресайза изображений до указанного размера.

    Args:
        image_file: Django UploadedFile объект
        max_size: Кортеж с максимальными размерами (ширина, высота), по умолчанию 300x300
        quality: Качество JPEG сжатия (1-100)

    Returns:
        ContentFile: Обработанное изображение размером 300x300 пикселей
    """
    try:
        # Открываем изображение
        image = Image.open(image_file)

        # Конвертируем в RGB если нужно (для поддержки PNG с прозрачностью)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Создаем белый фон для прозрачных изображений
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')

        # Вычисляем новые размеры с сохранением пропорций
        original_width, original_height = image.size
        max_width, max_height = max_size

        # Если изображение меньше максимального размера, не изменяем его
        if original_width <= max_width and original_height <= max_height:
            # Сохраняем как есть, но оптимизируем качество
            output = BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            output.seek(0)

            # Определяем имя файла
            original_name = getattr(image_file, 'name', 'image.jpg')
            name, ext = os.path.splitext(original_name)
            new_name = f"{name}_optimized.jpg"

            return ContentFile(output.getvalue(), name=new_name)

        # Вычисляем коэффициент масштабирования
        width_ratio = max_width / original_width
        height_ratio = max_height / original_height
        ratio = min(width_ratio, height_ratio)

        # Новые размеры
        new_width = int(original_width * ratio)
        new_height = int(original_height * ratio)

        # Ресайзим изображение
        resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Если нужно сделать изображение точно 300x300, добавляем padding
        if new_width != max_width or new_height != max_height:
            # Создаем новое изображение с нужным размером и белым фоном
            final_image = Image.new('RGB', max_size, (255, 255, 255))

            # Вычисляем позицию для центрирования
            x = (max_width - new_width) // 2
            y = (max_height - new_height) // 2

            # Вставляем ресайзенное изображение по центру
            final_image.paste(resized_image, (x, y))
            resized_image = final_image

        # Сохраняем в BytesIO
        output = BytesIO()
        resized_image.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)

        # Определяем имя файла
        original_name = getattr(image_file, 'name', 'image.jpg')
        name, ext = os.path.splitext(original_name)
        new_name = f"{name}_resized.jpg"

        return ContentFile(output.getvalue(), name=new_name)

    except Exception as e:
        # В случае ошибки возвращаем оригинальный файл
        print(f"Ошибка при обработке изображения: {e}")
        return image_file


def validate_and_process_image(image_file):
    """
    Валидация и обработка изображения товара:
    - Проверка формата (jpg, png, webp)
    - Автоматический ресайз до 300x300
    - Возврат обработанного файла
    """
    # Допустимые форматы изображений
    allowed_formats = ['JPEG', 'PNG', 'WEBP']
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']

    # Проверяем расширение файла
    file_name = getattr(image_file, 'name', '')
    file_extension = os.path.splitext(file_name.lower())[1]

    if file_extension not in allowed_extensions:
        raise ValidationError(
            f"Неподдерживаемый формат файла. Разрешены только: {', '.join(allowed_extensions)}"
        )

    try:
        # Открываем изображение для проверки
        image = Image.open(image_file)

        # Проверяем формат
        if image.format not in allowed_formats:
            raise ValidationError(
                f"Неподдерживаемый формат изображения. Разрешены только: JPG, PNG, WebP"
            )

        # Сбрасываем указатель файла
        image_file.seek(0)

        # Обрабатываем изображение (ресайз)
        processed_image = resize_image(image_file)

        return processed_image

    except Exception as e:
        if isinstance(e, ValidationError):
            raise e
        raise ValidationError(f"Ошибка при обработке изображения: {str(e)}")